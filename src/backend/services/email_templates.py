# email_templates.py

def get_interview_credentials_template(candidate_name, position, username, password, login_url, schedule_info):
    """
    Generates HTML for Interview Credentials.
    schedule_info: A string describing the date or deadline.
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            .container {{ font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: auto; border: 1px solid #e0e0e0; border-radius: 10px; overflow: hidden; }}
            .header {{ background-color: #2563eb; color: white; padding: 25px; text-align: center; }}
            .content {{ padding: 30px; color: #334155; line-height: 1.6; }}
            .cred-box {{ background-color: #f8fafc; border: 1px dashed #cbd5e1; padding: 20px; border-radius: 8px; margin: 20px 0; }}
            .label {{ font-weight: bold; color: #64748b; font-size: 0.9em; }}
            .value {{ font-family: 'Courier New', monospace; font-size: 1.1em; color: #1e293b; font-weight: bold; }}
            .button {{ display: inline-block; padding: 12px 25px; background-color: #2563eb; color: white !important; text-decoration: none; border-radius: 5px; font-weight: bold; margin-top: 20px; }}
            .footer {{ background-color: #f1f5f9; padding: 15px; text-align: center; font-size: 12px; color: #94a3b8; }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Interview Invitation</h1>
            </div>
            <div class="content">
                <p>Hello <strong>{candidate_name}</strong>,</p>
                <p>You have been scheduled for an interview for the position of <strong>{position}</strong>.</p>
                
                <p><strong>Schedule Details:</strong> {schedule_info}</p>

                <p>Please use the credentials below to log in to our assessment portal:</p>
                
                <div class="cred-box">
                    <span class="label">Username:</span><br>
                    <span class="value">{username}</span><br><br>
                    <span class="label">Password:</span><br>
                    <span class="value">{password}</span>
                </div>

                <p>We recommend logging in a few minutes early to test your setup.</p>
                
                <div style="text-align: center;">
                    <a href="{login_url}" class="button">Access Interview Portal</a>
                </div>
            </div>
            <div class="footer">
                <p>This is an automated message from the Interview Simulation Platform.</p>
                <p>&copy; 2026 Your Company Name</p>
            </div>
        </div>
    </body>
    </html>
    """