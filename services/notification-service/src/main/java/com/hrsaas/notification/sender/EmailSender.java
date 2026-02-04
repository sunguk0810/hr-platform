package com.hrsaas.notification.sender;

import com.hrsaas.notification.domain.entity.Notification;
import com.hrsaas.notification.domain.entity.NotificationChannel;
import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Component;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

@Slf4j
@Component
@RequiredArgsConstructor
public class EmailSender implements NotificationSender {

    private final JavaMailSender mailSender;
    private final TemplateEngine templateEngine;

    @Value("${notification.email.from:noreply@hrsaas.com}")
    private String fromAddress;

    @Value("${notification.email.from-name:HR SaaS}")
    private String fromName;

    @Value("${notification.email.enabled:true}")
    private boolean emailEnabled;

    @Override
    public boolean send(Notification notification) {
        if (!emailEnabled) {
            log.debug("Email sending is disabled");
            return true;
        }

        if (notification.getRecipientEmail() == null || notification.getRecipientEmail().isBlank()) {
            log.warn("No recipient email for notification: {}", notification.getId());
            return false;
        }

        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom(fromAddress, fromName);
            helper.setTo(notification.getRecipientEmail());
            helper.setSubject(notification.getTitle());

            String htmlContent = buildHtmlContent(notification);
            helper.setText(htmlContent, true);

            mailSender.send(message);

            log.info("Email sent successfully: to={}, subject={}",
                notification.getRecipientEmail(), notification.getTitle());
            return true;
        } catch (MessagingException e) {
            log.error("Failed to send email: to={}, error={}",
                notification.getRecipientEmail(), e.getMessage());
            return false;
        } catch (Exception e) {
            log.error("Unexpected error sending email: to={}", notification.getRecipientEmail(), e);
            return false;
        }
    }

    @Override
    public boolean supports(Notification notification) {
        return notification.getChannel() == NotificationChannel.EMAIL;
    }

    @Override
    public int getPriority() {
        return 10;
    }

    private String buildHtmlContent(Notification notification) {
        try {
            Context context = new Context();
            context.setVariable("title", notification.getTitle());
            context.setVariable("content", notification.getContent());
            context.setVariable("linkUrl", notification.getLinkUrl());
            context.setVariable("notificationType", notification.getNotificationType());

            return templateEngine.process("email/notification", context);
        } catch (Exception e) {
            log.warn("Template processing failed, using plain content: {}", e.getMessage());
            return buildFallbackHtml(notification);
        }
    }

    private String buildFallbackHtml(Notification notification) {
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"></head><body>");
        html.append("<div style=\"font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;\">");
        html.append("<h2 style=\"color: #333;\">").append(notification.getTitle()).append("</h2>");
        html.append("<div style=\"color: #666; line-height: 1.6;\">").append(notification.getContent()).append("</div>");

        if (notification.getLinkUrl() != null && !notification.getLinkUrl().isBlank()) {
            html.append("<p style=\"margin-top: 20px;\">");
            html.append("<a href=\"").append(notification.getLinkUrl())
                .append("\" style=\"background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;\">")
                .append("자세히 보기</a>");
            html.append("</p>");
        }

        html.append("<hr style=\"margin-top: 30px; border: none; border-top: 1px solid #eee;\"/>");
        html.append("<p style=\"color: #999; font-size: 12px;\">이 이메일은 HR SaaS 시스템에서 자동으로 발송되었습니다.</p>");
        html.append("</div></body></html>");
        return html.toString();
    }
}
