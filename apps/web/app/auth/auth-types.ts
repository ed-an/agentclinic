export type Session = Readonly<{
  accountId: string;
  email: string;
  role: 'AGENT' | 'STAFF';
  agent: { id: string; name: string } | null;
  expiresAt: string;
  csrfToken: string;
}>;
