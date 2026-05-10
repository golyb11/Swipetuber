import { GoogleSignin } from '@react-native-google-signin/google-signin';

GoogleSignin.configure({
  webClientId: '681780084433-huhh9s7m77nvnlkai1ft9pcg6t24ce4u.apps.googleusercontent.com',
  scopes: [
    'https://www.googleapis.com/auth/youtube.readonly',
    'https://www.googleapis.com/auth/youtube.force-ssl',
  ],
  offlineAccess: true,
});

export { GoogleSignin };
