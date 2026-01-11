package com.habittracker.service;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailService {

    @Autowired
    private JavaMailSender mailSender;

    @Value("${app.frontend-url:http://localhost:3000}")
    private String frontendUrl;

    @Value("${spring.mail.username:}")
    private String fromEmail;

    public void sendPasswordResetEmail(String to, String resetToken) {
        String resetLink = frontendUrl + "/reset-password/" + resetToken;
        String subject = "[습관 트래커] 비밀번호 재설정";
        String content = buildPasswordResetEmailContent(resetLink);

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromEmail);
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(content, true);

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Failed to send password reset email", e);
        }
    }

    private String buildPasswordResetEmailContent(String resetLink) {
        return """
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <style>
                    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { text-align: center; margin-bottom: 30px; }
                    .logo { font-size: 48px; margin-bottom: 10px; }
                    .title { font-size: 24px; font-weight: 600; color: #1a1a1a; }
                    .content { background: #f8f9fa; border-radius: 12px; padding: 30px; margin-bottom: 20px; }
                    .button { display: inline-block; background: linear-gradient(135deg, #6B73FF, #3843FF); color: white; text-decoration: none; padding: 14px 28px; border-radius: 12px; font-weight: 500; margin: 20px 0; }
                    .footer { text-align: center; color: #666; font-size: 14px; margin-top: 30px; }
                    .warning { color: #e74c3c; font-size: 13px; margin-top: 15px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <div class="logo">✨</div>
                        <div class="title">습관 트래커</div>
                    </div>
                    <div class="content">
                        <p>안녕하세요,</p>
                        <p>비밀번호 재설정 요청을 받았습니다. 아래 버튼을 클릭하여 새 비밀번호를 설정하세요.</p>
                        <div style="text-align: center;">
                            <a href="%s" class="button">비밀번호 재설정</a>
                        </div>
                        <p class="warning">이 링크는 1시간 후에 만료됩니다. 본인이 요청하지 않았다면 이 이메일을 무시하세요.</p>
                    </div>
                    <div class="footer">
                        <p>이 이메일은 습관 트래커에서 자동으로 발송되었습니다.</p>
                    </div>
                </div>
            </body>
            </html>
            """.formatted(resetLink);
    }
}
