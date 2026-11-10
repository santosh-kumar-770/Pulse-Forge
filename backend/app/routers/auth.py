import random
from datetime import datetime, timedelta, timezone
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.database import get_db
from app.models import User
from app.schemas import (
    UserCreate, UserLogin, UserUpdate, UserOut, Token,
    EmailVerificationRequest, ResendVerificationRequest
)
from app.auth import get_password_hash, verify_password, create_access_token, get_current_user
from app.services.email import (
    send_verification_email, send_welcome_email, send_welcome_back_email
)

router = APIRouter(prefix="/api/auth", tags=["auth"])

@router.post("/register")
@router.post("/signup")
async def signup(user_in: UserCreate, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == user_in.email.lower()))
    existing = result.scalars().first()
    if existing:
        if existing.is_verified:
            raise HTTPException(status_code=400, detail="A verified user with this email already exists.")
        # If user registered earlier but never verified, refresh code and re-send
        otp = f"{random.randint(100000, 999999)}"
        existing.name = user_in.name
        existing.hashed_password = get_password_hash(user_in.password)
        existing.role_title = user_in.role_title or existing.role_title
        existing.verification_code = otp
        existing.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        send_verification_email(existing.email, existing.name, otp)
        return {
            "status": "verification_required",
            "email": existing.email,
            "message": "Registration received. A 6-digit verification code has been sent to your email."
        }

    hashed_pw = get_password_hash(user_in.password)
    otp = f"{random.randint(100000, 999999)}"
    now = datetime.now(timezone.utc)

    new_user = User(
        name=user_in.name,
        email=user_in.email.lower(),
        hashed_password=hashed_pw,
        role_title=user_in.role_title or "Full-Stack Engineer",
        avatar_url=user_in.avatar_url or f"https://api.dicebear.com/7.x/bottts/svg?seed={user_in.name}",
        skills=user_in.skills or [],
        bio=user_in.bio or "",
        is_verified=False,
        verification_code=otp,
        verification_code_expires_at=now + timedelta(minutes=15),
        created_at=now
    )
    db.add(new_user)
    await db.commit()
    await db.refresh(new_user)

    # Dispatch verification email with 6-digit OTP
    send_verification_email(new_user.email, new_user.name, otp)

    return {
        "status": "verification_required",
        "email": new_user.email,
        "message": "Registration received. Please enter the 6-digit verification code sent to your email."
    }

@router.post("/verify-email", response_model=Token)
async def verify_email(req: EmailVerificationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found with this email.")

    if user.is_verified:
        # Already verified; issue token directly
        token = create_access_token(data={"sub": str(user.id), "email": user.email})
        return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

    now = datetime.now(timezone.utc)
    if not user.verification_code or user.verification_code != req.code.strip():
        raise HTTPException(status_code=400, detail="Invalid 6-digit verification code.")

    if user.verification_code_expires_at and user.verification_code_expires_at < now:
        raise HTTPException(
            status_code=400,
            detail="Verification code has expired. Please request a new code."
        )

    # Mark verified and clear OTP
    user.is_verified = True
    user.verification_code = None
    user.verification_code_expires_at = None
    user.last_login_at = now
    await db.commit()
    await db.refresh(user)

    # Send welcome aboard email
    send_welcome_email(user.email, user.name)

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.post("/resend-code")
async def resend_verification_code(req: ResendVerificationRequest, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == req.email.lower()))
    user = result.scalars().first()
    if not user:
        raise HTTPException(status_code=404, detail="No user found with this email.")

    if user.is_verified:
        raise HTTPException(status_code=400, detail="This account is already verified. You can log in directly.")

    otp = f"{random.randint(100000, 999999)}"
    user.verification_code = otp
    user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
    await db.commit()

    send_verification_email(user.email, user.name, otp)
    return {"status": "success", "message": "A fresh 6-digit verification code has been sent to your email."}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(User).where(User.email == credentials.email.lower()))
    user = result.scalars().first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No account found with this email. Please switch to 'Create Account' tab to sign up.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    if not verify_password(credentials.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect password. Please verify and try again.",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Enforce verification
    if not user.is_verified:
        otp = f"{random.randint(100000, 999999)}"
        user.verification_code = otp
        user.verification_code_expires_at = datetime.now(timezone.utc) + timedelta(minutes=15)
        await db.commit()
        send_verification_email(user.email, user.name, otp)
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Email verification required. We just sent a 6-digit code to your email.",
        )

    # Check inactivity threshold for Welcome Back email (e.g. > 3 days or first time)
    now = datetime.now(timezone.utc)
    if user.last_login_at is None or (now - user.last_login_at) > timedelta(days=3):
        send_welcome_back_email(user.email, user.name)

    user.last_login_at = now
    await db.commit()
    await db.refresh(user)

    token = create_access_token(data={"sub": str(user.id), "email": user.email})
    return Token(access_token=token, token_type="bearer", user=UserOut.model_validate(user))

@router.get("/me", response_model=UserOut)
async def get_me(current_user: User = Depends(get_current_user)):
    return current_user

@router.put("/profile", response_model=UserOut)
async def update_profile(
    profile_in: UserUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    if profile_in.name is not None:
        current_user.name = profile_in.name
    if profile_in.role_title is not None:
        current_user.role_title = profile_in.role_title
    if profile_in.avatar_url is not None:
        current_user.avatar_url = profile_in.avatar_url
    if profile_in.skills is not None:
        current_user.skills = profile_in.skills
    if profile_in.bio is not None:
        current_user.bio = profile_in.bio

    await db.commit()
    await db.refresh(current_user)
    return current_user

@router.get("/users", response_model=List[UserOut])
async def list_available_users(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    result = await db.execute(select(User).order_by(User.name.asc()))
    return result.scalars().all()
