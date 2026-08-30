// src/emails/verification-template.tsx
import * as React from 'react';

interface VerificationEmailTemplateProps {
  firstName: string;
  verificationCode: string;
}

export function VerificationEmailTemplate({ 
  firstName, 
  verificationCode
}: VerificationEmailTemplateProps) {
  const verifyUrl = `${process.env.NEXT_PUBLIC_URL}/verify-email?code=${verificationCode}`;
  
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      </head>
      <body style={{
        margin: 0,
        padding: 0,
        backgroundColor: '#f3f4f6',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
      }}>
        {/* Container Principal */}
        <table width="100%" cellPadding="0" cellSpacing="0" style={{ backgroundColor: '#f3f4f6' }}>
          <tr>
            <td align="center" style={{ padding: '40px 20px' }}>
              {/* Card do Email */}
              <table width="600" cellPadding="0" cellSpacing="0" style={{
                backgroundColor: '#ffffff',
                borderRadius: '16px',
                boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                {/* Header com Gradiente */}
                <tr>
                  <td style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #0d9488 100%)',
                    padding: '40px 30px',
                    textAlign: 'center'
                  }}>
                    <h1 style={{
                      margin: 0,
                      color: '#ffffff',
                      fontSize: '32px',
                      fontWeight: 'bold',
                      letterSpacing: '-0.5px'
                    }}>
                      ✉️ Verifique seu Email
                    </h1>
                    <p style={{
                      margin: '10px 0 0 0',
                      color: '#ffffff',
                      fontSize: '16px',
                      opacity: 0.95
                    }}>
                      Courtesyfy
                    </p>
                  </td>
                </tr>

                {/* Corpo do Email */}
                <tr>
                  <td style={{ padding: '40px 30px' }}>
                    {/* Saudação */}
                    <p style={{
                      margin: '0 0 20px 0',
                      fontSize: '18px',
                      color: '#1f2937',
                      lineHeight: '1.6'
                    }}>
                      Olá <strong style={{ color: '#10b981' }}>{firstName}</strong>,
                    </p>

                    <p style={{
                      margin: '0 0 30px 0',
                      fontSize: '16px',
                      color: '#4b5563',
                      lineHeight: '1.6'
                    }}>
                      Obrigado por se cadastrar no Courtesyfy! Para continuar, precisamos verificar seu email.
                    </p>

                    {/* Card com Código */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: '#f0fdfa',
                      borderRadius: '12px',
                      border: '2px solid #10b981',
                      marginBottom: '30px'
                    }}>
                      <tr>
                        <td style={{ padding: '30px', textAlign: 'center' }}>
                          <p style={{
                            margin: '0 0 15px 0',
                            fontSize: '16px',
                            color: '#047857',
                            fontWeight: '600'
                          }}>
                            Seu código de verificação:
                          </p>
                          
                          {/* Código Grande */}
                          <div style={{
                            backgroundColor: '#ffffff',
                            border: '2px dashed #10b981',
                            borderRadius: '8px',
                            padding: '20px',
                            display: 'inline-block'
                          }}>
                            <p style={{
                              margin: 0,
                              fontSize: '36px',
                              fontWeight: 'bold',
                              color: '#065f46',
                              letterSpacing: '8px',
                              fontFamily: 'monospace'
                            }}>
                              {verificationCode}
                            </p>
                          </div>

                          <p style={{
                            margin: '15px 0 0 0',
                            fontSize: '14px',
                            color: '#6b7280'
                          }}>
                            Este código expira em <strong>5 minutos</strong>
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Botão de Verificação */}
                    <table width="100%" cellPadding="0" cellSpacing="0">
                      <tr>
                        <td align="center" style={{ padding: '0 0 30px 0' }}>
                          <a href={verifyUrl} style={{
                            display: 'inline-block',
                            padding: '16px 48px',
                            backgroundColor: '#10b981',
                            color: '#ffffff',
                            textDecoration: 'none',
                            borderRadius: '8px',
                            fontSize: '16px',
                            fontWeight: '600',
                            boxShadow: '0 4px 6px rgba(16, 185, 129, 0.3)'
                          }}>
                            ✓ VERIFICAR EMAIL
                          </a>
                        </td>
                      </tr>
                    </table>

                    {/* Informação Alternativa */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: '#fef3c7',
                      borderRadius: '8px',
                      border: '1px solid #fbbf24',
                      marginBottom: '20px'
                    }}>
                      <tr>
                        <td style={{ padding: '16px' }}>
                          <p style={{
                            margin: 0,
                            fontSize: '14px',
                            color: '#92400e',
                            lineHeight: '1.5'
                          }}>
                            <strong>💡 Dica:</strong> Se o botão não funcionar, copie e cole o código acima 
                            na página de verificação.
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Mensagem de Segurança */}
                    <table width="100%" cellPadding="0" cellSpacing="0" style={{
                      backgroundColor: '#fee2e2',
                      borderRadius: '8px',
                      border: '1px solid #ef4444',
                      marginBottom: '20px'
                    }}>
                      <tr>
                        <td style={{ padding: '16px' }}>
                          <p style={{
                            margin: 0,
                            fontSize: '13px',
                            color: '#991b1b',
                            lineHeight: '1.5'
                          }}>
                            <strong>🔒 Segurança:</strong> Se você não solicitou este cadastro, 
                            ignore este email. Nunca compartilhe este código com ninguém.
                          </p>
                        </td>
                      </tr>
                    </table>

                    {/* Mensagem Final */}
                    <p style={{
                      margin: '0',
                      fontSize: '15px',
                      color: '#6b7280',
                      lineHeight: '1.6',
                      textAlign: 'center'
                    }}>
                      Bem-vindo ao Courtesyfy!<br />
                      Estamos felizes em tê-lo conosco.
                    </p>
                  </td>
                </tr>

                {/* Footer */}
                <tr>
                  <td style={{
                    backgroundColor: '#f9fafb',
                    padding: '30px',
                    textAlign: 'center',
                    borderTop: '1px solid #e5e7eb'
                  }}>
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '14px',
                      color: '#6b7280'
                    }}>
                      <strong style={{ color: '#10b981' }}>Courtesyfy</strong>
                    </p>
                    <p style={{
                      margin: '0 0 10px 0',
                      fontSize: '13px',
                      color: '#9ca3af'
                    }}>
                      Gestão de Cortesias e Campanhas
                    </p>
                    <p style={{
                      margin: 0,
                      fontSize: '12px',
                      color: '#9ca3af'
                    }}>
                      © {new Date().getFullYear()} Courtesyfy. Todos os direitos reservados.
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
    </html>
  );
}