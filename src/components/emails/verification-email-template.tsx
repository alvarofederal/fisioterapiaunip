// src/components/emails/verification-email-template.tsx
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'

interface VerificationEmailTemplateProps {
  code: string
  expiresInMinutes?: number
}

export const VerificationEmailTemplate = ({
  code,
  expiresInMinutes = 0.5, // 30 segundos = 0.5 minutos
}: VerificationEmailTemplateProps) => {
  const expiresText = expiresInMinutes < 1 
    ? `${expiresInMinutes * 60} segundos` 
    : `${expiresInMinutes} minuto${expiresInMinutes > 1 ? 's' : ''}`

  return (
    <Html>
      <Head />
      <Preview>Seu código de verificação Courtesyfy: {code}</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header com gradiente */}
          <Section style={header}>
            <Heading style={headerTitle}>🎫 Courtesyfy</Heading>
          </Section>

          {/* Conteúdo */}
          <Section style={content}>
            <Heading style={title}>Bem-vindo ao Courtesyfy!</Heading>
            
            <Text style={paragraph}>
              Obrigado por se cadastrar. Para ativar sua conta, use o código de verificação abaixo:
            </Text>

            {/* Box do código */}
            <Section style={codeBox}>
              <Text style={codeLabel}>SEU CÓDIGO DE VERIFICAÇÃO</Text>
              <Text style={codeText}>{code}</Text>
            </Section>

            {/* Aviso de expiração */}
            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>ATENÇÃO:</strong> Este código expira em <strong>{expiresText}</strong>!
              </Text>
            </Section>

            <Text style={paragraphSmall}>
              Se você não solicitou este cadastro, ignore este email.
            </Text>
          </Section>

          {/* Footer */}
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Courtesyfy. Todos os direitos reservados.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

// Estilos
const main = {
  backgroundColor: '#f4f4f4',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif',
}

const container = {
  margin: '40px auto',
  maxWidth: '600px',
  backgroundColor: '#ffffff',
  borderRadius: '12px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const header = {
  background: 'linear-gradient(135deg, #10b981 0%, #14b8a6 100%)',
  padding: '40px 30px',
  textAlign: 'center' as const,
}

const headerTitle = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
}

const content = {
  padding: '40px 30px',
}

const title = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  marginTop: '0',
}

const paragraph = {
  color: '#4b5563',
  fontSize: '16px',
  lineHeight: '24px',
}

const paragraphSmall = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '20px',
}

const codeBox = {
  background: 'linear-gradient(135deg, #f0fdf4 0%, #ccfbf1 100%)',
  border: '3px dashed #10b981',
  borderRadius: '12px',
  padding: '30px',
  textAlign: 'center' as const,
  margin: '30px 0',
}

const codeLabel = {
  fontSize: '14px',
  color: '#059669',
  fontWeight: '600',
  marginBottom: '10px',
}

const codeText = {
  fontSize: '48px',
  fontWeight: 'bold',
  letterSpacing: '8px',
  color: '#059669',
  fontFamily: '"Courier New", monospace',
  margin: '0',
}

const warningBox = {
  backgroundColor: '#fef3c7',
  borderLeft: '4px solid #f59e0b',
  padding: '15px',
  borderRadius: '4px',
  margin: '20px 0',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  margin: '0',
}

const footer = {
  backgroundColor: '#f9fafb',
  padding: '30px',
  textAlign: 'center' as const,
}

const footerText = {
  color: '#6b7280',
  fontSize: '14px',
  margin: '0',
}

export default VerificationEmailTemplate