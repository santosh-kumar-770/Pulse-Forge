import json
import logging
import urllib.request
import urllib.error
from typing import Optional, List
from datetime import datetime
from app.config import settings

logger = logging.getLogger("pulseforge.email")

def send_email_sync(to_email: str, subject: str, html_body: str, text_body: Optional[str] = None) -> bool:
    """
    Sends an email using Resend API if RESEND_API_KEY is configured.
    Falls back gracefully to structured server console logging.
    """
    api_key = settings.RESEND_API_KEY
    from_email = settings.FROM_EMAIL

    # Visual server console log for traceability & test inspection
    print("=" * 60)
    print(f"📧 [PULSEFORGE EMAIL NOTIFICATION]")
    print(f"To: {to_email}")
    print(f"Subject: {subject}")
    if text_body:
        print(f"Body:\n{text_body.strip()}")
    print("=" * 60)

    if not api_key:
        logger.info(f"Email logged to console (RESEND_API_KEY not configured). Target: {to_email}")
        return True

    try:
        url = "https://api.resend.com/emails"
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "User-Agent": "PulseForge-App/1.0"
        }
        payload = {
            "from": from_email,
            "to": [to_email],
            "subject": subject,
            "html": html_body,
            "text": text_body or subject
        }
        data = json.dumps(payload).encode("utf-8")
        req = urllib.request.Request(url, data=data, headers=headers, method="POST")
        with urllib.request.urlopen(req, timeout=10) as response:
            res_body = response.read().decode("utf-8")
            logger.info(f"Email successfully delivered to {to_email} via Resend. Response: {res_body}")
            return True
    except Exception as e:
        logger.error(f"Failed to dispatch email via Resend API to {to_email}: {e}")
        # Return True so downstream auth/tasks don't fail if third-party email is down
        return False


def send_verification_email(to_email: str, name: str, code: str) -> bool:
    subject = "Welcome to PulseForge - Verify your email"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #6366f1, #8b5cf6); border-radius: 12px; margin-bottom: 12px;">
                <span style="font-size: 28px;">🔥</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">PulseForge War Room</h1>
            <p style="color: #94a3b8; font-size: 14px; margin-top: 4px;">High-velocity roadmap tracker for hackathons & startup sprints</p>
        </div>

        <div style="background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
            <p style="margin-top: 0; color: #e2e8f0; font-size: 15px;">Hey <strong>{name}</strong>,</p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
                Welcome to PulseForge! Use the 6-digit verification code below to verify your email address and activate your hacker account.
            </p>
            
            <div style="text-align: center; margin: 28px 0;">
                <div style="display: inline-block; background: #1e1b4b; border: 2px dashed #6366f1; padding: 14px 28px; border-radius: 12px;">
                    <span style="font-family: monospace; font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #a5b4fc;">{code}</span>
                </div>
                <p style="color: #64748b; font-size: 12px; margin-top: 8px;">Code expires in <strong>15 minutes</strong>.</p>
            </div>
            
            <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">
                If you did not request this account, please ignore this email.
            </p>
        </div>

        <p style="text-align: center; color: #475569; font-size: 11px; margin: 0;">
            PulseForge • Built for high-velocity teams
        </p>
    </div>
    """
    text = f"""
Welcome to PulseForge, {name}!

Your 6-digit email verification code is: {code}

This code expires in 15 minutes. Enter it in the app to activate your hacker account.

PulseForge — Built for high-velocity hackathons & startup sprints
    """
    return send_email_sync(to_email, subject, html, text)


def send_welcome_email(to_email: str, name: str) -> bool:
    subject = "Welcome aboard PulseForge! Your war room is ready."
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <div style="text-align: center; margin-bottom: 24px;">
            <div style="display: inline-block; padding: 12px; background: linear-gradient(135deg, #10b981, #6366f1); border-radius: 12px; margin-bottom: 12px;">
                <span style="font-size: 28px;">🚀</span>
            </div>
            <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 800;">Email Verified Successfully!</h1>
        </div>

        <div style="background: #111827; padding: 24px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 24px;">
            <p style="margin-top: 0; color: #e2e8f0; font-size: 15px;">Welcome to the team, <strong>{name}</strong>!</p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.6;">
                Your account is fully verified. You can now join active hackathon war rooms, track high-velocity sprints, pin critical API keys in the knowledge vault, and celebrate milestones with your team.
            </p>
            <div style="text-align: center; margin: 24px 0;">
                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 14px; padding: 12px 28px; border-radius: 10px; box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);">
                    Launch War Room Dashboard &rarr;
                </a>
            </div>
        </div>

        <p style="text-align: center; color: #475569; font-size: 11px; margin: 0;">
            PulseForge • Built for high-velocity teams
        </p>
    </div>
    """
    text = f"""
Welcome aboard PulseForge, {name}!

Your account is now verified and active. Your war room is ready to track tasks, pin API vault items, and ship high-velocity milestones.

Open PulseForge: {settings.FRONTEND_URL}
    """
    return send_email_sync(to_email, subject, html, text)


def send_welcome_back_email(to_email: str, name: str) -> bool:
    subject = f"Welcome back to PulseForge, {name}!"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 16px; border: 1px solid #1e293b;">
        <h2 style="color: #ffffff; margin-top: 0; font-size: 22px;">Welcome back, {name}! 👋</h2>
        <div style="background: #111827; padding: 20px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.6; margin-top: 0;">
                It has been a little while since your last session! Your teammates and war rooms are actively sprinting.
            </p>
            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Jump back in to check new gate completions, review tasks in progress, and coordinate in real-time chat.
            </p>
            <div style="margin-top: 18px;">
                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: #6366f1; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px;">
                    Resume War Room &rarr;
                </a>
            </div>
        </div>
        <p style="text-align: center; color: #475569; font-size: 11px; margin: 0;">
            PulseForge Inactivity Notice
        </p>
    </div>
    """
    text = f"""
Welcome back to PulseForge, {name}!

It has been a little while since your last session! Your teammates and war rooms are actively sprinting.
Jump back in to inspect your mission board: {settings.FRONTEND_URL}
    """
    return send_email_sync(to_email, subject, html, text)


def send_deadline_alert_email(to_email: str, user_name: str, task_title: str, room_name: str, status: str, due_date: datetime) -> bool:
    subject = f"[Deadline Alert] Task '{task_title}' due soon in {room_name}"
    due_str = due_date.strftime("%b %d, %Y at %I:%M %p UTC") if due_date else "Soon"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 16px; border: 1px solid #e11d48;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="font-size: 24px;">⏰</span>
            <h2 style="color: #f43f5e; margin: 0; font-size: 20px;">Task Deadline Approaching!</h2>
        </div>

        <div style="background: #111827; padding: 22px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
            <p style="margin-top: 0; color: #e2e8f0; font-size: 14px;">Hey <strong>{user_name}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
                You have a task due within the next 2 hours in <strong style="color: #818cf8;">{room_name}</strong>:
            </p>

            <div style="background: #1e1b4b; border-left: 4px solid #f43f5e; padding: 14px 18px; border-radius: 8px; margin: 18px 0;">
                <h3 style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px;">{task_title}</h3>
                <div style="font-size: 13px; color: #cbd5e1;">
                    <span>Stage: <strong style="color: #f59e0b; text-transform: uppercase;">{status.replace('_', ' ')}</strong></span> • 
                    <span>Due: <strong>{due_str}</strong></span>
                </div>
            </div>

            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Please update your task progress or move it to <em>Review</em> / <em>Done</em> if complete!
            </p>

            <div style="margin-top: 18px;">
                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: #f43f5e; color: #ffffff; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px;">
                    View & Update Task &rarr;
                </a>
            </div>
        </div>

        <p style="text-align: center; color: #475569; font-size: 11px; margin: 0;">
            PulseForge Automated Sprint Monitor
        </p>
    </div>
    """
    text = f"""
[Deadline Alert] Task '{task_title}' due soon in {room_name}

Hey {user_name},
The following task is due soon ({due_str}):
- Title: {task_title}
- Current Status: {status}
- War Room: {room_name}

Update your progress here: {settings.FRONTEND_URL}
    """
    return send_email_sync(to_email, subject, html, text)


def send_overdue_checkin_email(to_email: str, user_name: str, task_title: str, room_name: str, due_date: datetime) -> bool:
    subject = f"[Check-in] Task '{task_title}' is past its deadline"
    due_str = due_date.strftime("%b %d, %Y at %I:%M %p UTC") if due_date else "Past Deadline"
    html = f"""
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; background: #090d16; color: #f1f5f9; padding: 32px; border-radius: 16px; border: 1px solid #f59e0b;">
        <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
            <span style="font-size: 24px;">⚠️</span>
            <h2 style="color: #f59e0b; margin: 0; font-size: 20px;">Task Check-in: Past Deadline</h2>
        </div>

        <div style="background: #111827; padding: 22px; border-radius: 12px; border: 1px solid #334155; margin-bottom: 20px;">
            <p style="margin-top: 0; color: #e2e8f0; font-size: 14px;">Hey <strong>{user_name}</strong>,</p>
            <p style="color: #cbd5e1; font-size: 14px; line-height: 1.5;">
                Friendly check-in regarding task <strong style="color: #ffffff;">'{task_title}'</strong> in <strong style="color: #818cf8;">{room_name}</strong>.
            </p>

            <div style="background: #27272a; border-left: 4px solid #f59e0b; padding: 14px 18px; border-radius: 8px; margin: 18px 0;">
                <h3 style="margin: 0 0 6px 0; color: #ffffff; font-size: 16px;">{task_title}</h3>
                <div style="font-size: 13px; color: #cbd5e1;">
                    Target Due Date was: <strong>{due_str}</strong>
                </div>
            </div>

            <p style="color: #94a3b8; font-size: 13px; line-height: 1.5;">
                Is this task already finished, blocked on a dependency, or does the timeline deadline need an extension?
            </p>

            <div style="margin-top: 18px;">
                <a href="{settings.FRONTEND_URL}" style="display: inline-block; background: #f59e0b; color: #090d16; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px;">
                    Update Task Status &rarr;
                </a>
            </div>
        </div>

        <p style="text-align: center; color: #475569; font-size: 11px; margin: 0;">
            PulseForge Automated Sprint Monitor
        </p>
    </div>
    """
    text = f"""
[Check-in] Task '{task_title}' is past its deadline

Hey {user_name},
Friendly check-in: '{task_title}' in {room_name} was scheduled for {due_str}.

Is this task finished, blocked, or does the timeline need an extension?
Please update it here: {settings.FRONTEND_URL}
    """
    return send_email_sync(to_email, subject, html, text)
