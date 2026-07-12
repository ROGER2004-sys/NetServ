import { sanitizeProfileUpdates } from './userProfileService';

describe('sanitizeProfileUpdates', () => {
    it('trims and normalizes profile values', () => {
        expect(
            sanitizeProfileUpdates({
                displayName: '  Mehdi  ',
                email: '  MEHDI@EXAMPLE.COM ',
                role: '  Responsable IT  '
            })
        ).toEqual({
            displayName: 'Mehdi',
            email: 'mehdi@example.com',
            role: 'Responsable IT'
        });
    });
});
