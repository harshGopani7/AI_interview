from email_config import send_general_email

# 1. Define your fixed HTML content
# You can use f-strings to inject dynamic names into the HTML
HTML_TEMPLATE = """
<!DOCTYPE html>
<html>
<head>
    <style>
        .container {{ font-family: Arial, sans-serif; border: 1px solid #ddd; padding: 20px; border-radius: 10px; }}
        .header {{ background-color: #4CAF50; color: white; padding: 10px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ padding: 20px; line-height: 1.6; color: #333; }}
        .footer {{ font-size: 12px; color: #777; margin-top: 20px; border-top: 1px solid #eee; padding-top: 10px; }}
        .button {{ background-color: #008CBA; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>Interview Simulation</h2>
        </div>
        <div class="content">
            <p>Hello,</p>
            <p>Thank you for choosing <strong>Interview Simulation</strong>. Your profile has been successfully set up.</p>
            <p>You can now start practicing your technical and behavioral interviews with our AI coach.</p>
            <br>
            <a href="https://yourwebsite.com/login" class="button">Start Your Session</a>
        </div>
        <div class="footer">
            <p>If you didn't request this email, please ignore it.</p>
            <p>&copy; 2026 Interview Simulation Team</p>
        </div>
    </div>
</body>
</html>
"""

def send_welcome_notification(user_email):
    subject = "Welcome to Interview Simulation - Your Account is Ready"
    
    # Fallback plain text version for older email clients
    plain_text = "Welcome to Interview Simulation! Please log in to your account to start."

    # Call your utility function
    success = send_general_email(
        subject=subject,
        recipient_email=user_email,
        body=plain_text,
        html_content=HTML_TEMPLATE
    )

    if success:
        print(f"🚀 Welcome email successfully delivered to {user_email}")
    else:
        print(f"⚠️ Failed to deliver welcome email to {user_email}")

# --- EXECUTION ---
if __name__ == "__main__":
    # Replace with the actual recipient address
    target_user = "bdgopani3@gmail.com" 
    send_welcome_notification(target_user)