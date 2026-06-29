import smtplib
import re  # Added for email validation
from email.message import EmailMessage

# Configuration
SMTP_SERVER = "smtp.gmail.com"
SMTP_PORT = 587
EMAIL_ADDRESS = "aiguru9873@gmail.com"
# Cleaned password: Remove spaces if they were copied from Google's display
EMAIL_PASSWORD = "mgbu fvvo qika gige" 
DEFAULT_FROM_NAME = "Interview Simulation"

def is_valid_email(email):
    """Simple regex to check if the email format is valid."""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return re.match(pattern, email) is not None

def send_general_email(subject, recipient_email, body, html_content=None):
    # 1. Validate Email Format locally first
    if not is_valid_email(recipient_email):
        print(f"❌ Error: '{recipient_email}' is not a valid email address format.")
        return False

    # 2. Create the email message object
    msg = EmailMessage()
    msg['Subject'] = subject
    msg['From'] = f"{DEFAULT_FROM_NAME} <{EMAIL_ADDRESS}>"
    msg['To'] = recipient_email
    msg.set_content(body)

    if html_content:
        msg.add_alternative(html_content, subtype='html')

    try:
        # 3. Connect and Send
        with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as smtp:
            smtp.starttls() 
            smtp.login(EMAIL_ADDRESS, EMAIL_PASSWORD)
            
            print(f"🚀 Attempting to send email to: {recipient_email}")
            smtp.send_message(msg)
            
        print(f"✅ Email sent successfully to {recipient_email}")
        return True

    except Exception as e:
        print(f"❌ SMTP Error: {e}")
        return False

# --- TEST THE FIX ---
if __name__ == "__main__":
    # Ensure you add the @domain.com here!
    send_general_email(
        subject="Test Debug", 
        recipient_email="parthgop3753@gmail.com", 
        body="This is a test to verify the fix."
    )