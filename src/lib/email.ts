import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendCandidacyConfirmation(
  candidateName: string,
  candidateEmail: string,
  area: string,
  course: string,
) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@ametsaude.com.br",
      to: candidateEmail,
      subject: "Candidatura Recebida - AMET Estágios 2027",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Olá ${candidateName},</h2>
          <p>Agradecemos sua candidatura para o programa de estágios da AMET!</p>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3>Resumo da sua candidatura:</h3>
            <p><strong>Área de interesse:</strong> ${area}</p>
            <p><strong>Curso atual:</strong> ${course}</p>
          </div>
          <p>Entraremos em contato pelo email informado em breve com informações sobre o processo de seleção.</p>
          <p>Qualquer dúvida, entre em contato conosco via WhatsApp: <a href="https://wa.me/5511932096496">(11) 93209-6496</a></p>
          <p>Att,<br/>Equipe AMET</p>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send confirmation email:", error);
  }
}

export async function sendAdminNotification(
  candidateName: string,
  candidateEmail: string,
  candidatePhone: string,
  cpf: string,
  rgm: string,
  area: string,
  course: string,
) {
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL || "noreply@ametsaude.com.br",
      to: process.env.RESEND_ADMIN_EMAIL || "ametsaude1@gmail.com",
      subject: `Nova Candidatura - ${area} - ${candidateName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Nova Candidatura Recebida</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Nome</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${candidateName}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Email</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${candidateEmail}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Telefone</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${candidatePhone}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>CPF</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${cpf}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>RGM</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${rgm}</td>
            </tr>
            <tr>
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Área</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${area}</td>
            </tr>
            <tr style="background-color: #f5f5f5;">
              <td style="padding: 10px; border: 1px solid #ddd;"><strong>Curso</strong></td>
              <td style="padding: 10px; border: 1px solid #ddd;">${course}</td>
            </tr>
          </table>
        </div>
      `,
    });
  } catch (error) {
    console.error("Failed to send admin notification:", error);
  }
}
