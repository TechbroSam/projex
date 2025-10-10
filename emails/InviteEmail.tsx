// emails/InviteEmail.tsx
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Text,
  Button,
} from '@react-email/components';
import * as React from 'react';

interface InviteEmailProps {
  inviterName: string;
  projectName: string;
  projectUrl: string;
}

export const InviteEmail = ({ inviterName, projectName, projectUrl }: InviteEmailProps) => (
  <Html>
    <Head />
    <Preview>You've been invited to collaborate on ProjeXY</Preview>
    <Body style={{ fontFamily: 'Helvetica, Arial, sans-serif', backgroundColor: '#f6f9fc' }}>
      <Container style={{ backgroundColor: '#ffffff', margin: '0 auto', padding: '40px', borderRadius: '8px' }}>
        <Heading style={{ fontSize: '24px', textAlign: 'center' }}>
          You're Invited!
        </Heading>
        <Text style={{ fontSize: '16px', textAlign: 'center' }}>
          <strong>{inviterName}</strong> has invited you to collaborate on the project: <strong>{projectName}</strong>.
        </Text>
        <Container style={{ textAlign: 'center', marginTop: '30px', marginBottom: '30px' }}>
          <Button
            style={{ backgroundColor: '#ea580c', color: 'white', padding: '12px 24px', borderRadius: '5px', textDecoration: 'none' }}
            href={projectUrl}
          >
            View Project
          </Button>
        </Container>
        <Text style={{ fontSize: '14px', textAlign: 'center', color: '#8898aa' }}>
          Join the project on ProjeXY to start collaborating.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default InviteEmail;