import { MOCK_PACKAGES as PERM_PACKAGES } from '../../permissions/data/mockData';

export const MOCK_USERS = [
    { id: 1, name: 'Ahmet Yılmaz', personal_email: 'ahmet.y@gmail.com', corporate_email: 'ahmet@terra.com', email: 'ahmet@terra.com', phone: '+90 532 123 45 67', role: 'admin', packages: [1], joined: '12.05.2023', left: '-', avatar: 'https://i.pravatar.cc/150?u=1' },
    { id: 2, name: 'Zeynep Kaya', personal_email: 'zeynep.k@hotmail.com', corporate_email: 'zeynep@terra.com', email: 'zeynep@terra.com', phone: '+90 544 987 65 43', role: 'doctor', packages: [2], joined: '01.09.2023', left: '-', avatar: 'https://i.pravatar.cc/150?u=2' },
    { id: 3, name: 'Mehmet Demir', personal_email: 'mehmet.d@yahoo.com', corporate_email: 'mehmet@terra.com', email: 'mehmet@terra.com', phone: '+90 505 555 12 12', role: 'staff', packages: [4], joined: '15.11.2023', left: '10.01.2024', avatar: 'https://i.pravatar.cc/150?u=3' },
    { id: 4, name: 'Selin Yıldız', personal_email: 'selin.y@gmail.com', corporate_email: 'selin@terra.com', email: 'selin@terra.com', phone: '+90 533 111 22 33', role: 'consultant', packages: [5], joined: '20.01.2024', left: '-', avatar: 'https://i.pravatar.cc/150?u=4' },
    { id: 5, name: 'Can Özkan', personal_email: 'can.o@outlook.com', corporate_email: 'can@terra.com', email: 'can@terra.com', phone: '+90 555 444 33 22', role: 'doctor', packages: [2], joined: '05.02.2024', left: '-', avatar: 'https://i.pravatar.cc/150?u=5' },
    { id: 6, name: 'Buse Aydın', personal_email: 'buse.a@gmail.com', corporate_email: 'buse@terra.com', email: 'buse@terra.com', phone: '+90 532 000 00 00', role: 'consultant', packages: [5], joined: '10.03.2024', left: '-', avatar: 'https://i.pravatar.cc/150?u=6' },
];

export const MOCK_PACKAGES = PERM_PACKAGES;
