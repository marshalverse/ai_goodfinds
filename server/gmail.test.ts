import { describe, expect, it } from "vitest";
import nodemailer from "nodemailer";

describe("Gmail SMTP credentials", () => {
  it("can verify SMTP connection with provided credentials", async () => {
    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    expect(gmailUser).toBeDefined();
    expect(gmailPass).toBeDefined();
    expect(gmailUser).toBe("marshalyuan6960@gmail.com");

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    });

    // Verify the connection - this will throw if credentials are invalid
    const verified = await transporter.verify();
    expect(verified).toBe(true);
  }, 15000);
});
