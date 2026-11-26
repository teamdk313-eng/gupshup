import type { CurrentUserProfile } from '../types/gupshup';

export const DEFAULT_USER_PROFILE: CurrentUserProfile = {
  id: 'me',
  name: 'Gupshup Member',
  username: '',
  email: '',
  bio: '',
  initials: 'GU',
  joinedLabel: 'Gupshup member',
  discoverable: true,
  readReceipts: true,
  onlineStatusVisible: false,
  authMode: 'google',
};

export const PRIVACY_SECTIONS = [
  {
    id: 'what-we-collect',
    number: '01',
    title: 'What we collect',
    body: 'We collect only the essentials needed for your Gupshup account: your Google display name, verified email address, optional profile photo, chosen @username, and the messages, photos, and voice notes you send.',
  },
  {
    id: 'how-we-use-it',
    number: '02',
    title: 'How we use it',
    body: 'Your information is used strictly to run the app: signing you in securely, showing your public profile and @username in Discover, delivering 1-to-1 messages, and connecting Google Drive when you choose to share or back up media.',
  },
  {
    id: 'who-can-see-it',
    number: '03',
    title: 'Who can see it',
    body: 'Only your unique public @username is shown in the Gupshup member directory. Your Google email address and other private account details are not displayed to other members.',
  },
  {
    id: 'blocking-and-reporting',
    number: '04',
    title: 'Blocking and reporting',
    body: 'You can block any user from their Contact Info or chat menu to immediately stop them from messaging you or viewing your status. You can unblock anyone anytime from Settings, or submit an abuse report for review.',
  },
  {
    id: 'data-retention',
    number: '05',
    title: 'Data retention and account deletion',
    body: 'Your active profile and message history remain available while your account is active. Choosing Delete Account in Settings permanently purges your profile, @handle, messages, media attachments, and contact lists.',
  },
  {
    id: 'contact',
    number: '06',
    title: 'Contact',
    body: 'For privacy questions, data requests, or safety concerns, reach out to our privacy team at support@gupshup.app.',
  },
];
