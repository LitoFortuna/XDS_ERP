import { onDocumentCreated } from 'firebase-functions/v2/firestore';
import { onRequest } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import * as webpush from 'web-push';

admin.initializeApp();

// VAPID keys for Web Push
const VAPID_PUBLIC_KEY = 'BH3e-LWfoyhlsgJXLK81MgSFmjW9ZtvFCyfy7rJ1K_kJaD-pExZdG48T8sSjJt4-KCrkPO2RDQSRmO_Xsb8my1I';
const VAPID_PRIVATE_KEY = 'N0JBhsFr2Yi6ljLg4uRgiyuICpuRqf68WPZO61b8WQE';
const VAPID_EMAIL = 'mailto:raulfdz3@gmail.com';

// Configure web-push
webpush.setVapidDetails(VAPID_EMAIL, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

/**
 * Triggered when a new activity log is created
 * Sends push notification to SuperAdmin
 */
export const onNewActivityLog = onDocumentCreated('activityLogs/{logId}', async (event) => {
    const snapshot = event.data;
    if (!snapshot) {
        console.log('No data associated with the event');
        return;
    }

    const activityData = snapshot.data();

    if (!activityData || activityData.targetRole !== 'SuperAdmin') {
        console.log('Activity not targeted at SuperAdmin, skipping');
        return;
    }

    console.log('New activity for SuperAdmin:', activityData.description);

    // Get all SuperAdmin push subscriptions
    const superAdminProfiles = await admin.firestore()
        .collection('userProfiles')
        .where('role', '==', 'SuperAdmin')
        .get();

    const notifications: Promise<any>[] = [];

    for (const doc of superAdminProfiles.docs) {
        const profile = doc.data();

        if (profile.pushSubscription) {
            try {
                const subscription = JSON.parse(profile.pushSubscription);

                const payload = JSON.stringify({
                    title: '📣 Nueva Actividad - XDS ERP',
                    body: activityData.description,
                    icon: '/android-chrome-192x192.png',
                    badge: '/android-chrome-192x192.png',
                    badgeCount: 1,
                    data: {
                        url: '/',
                        type: activityData.type
                    }
                });

                notifications.push(
                    webpush.sendNotification(subscription, payload)
                        .catch((error: any) => {
                            console.error('Error sending notification:', error);
                            if (error.statusCode === 410) {
                                return admin.firestore()
                                    .collection('userProfiles')
                                    .doc(doc.id)
                                    .update({ pushSubscription: admin.firestore.FieldValue.delete() });
                            }
                            return null;
                        })
                );
            } catch (e) {
                console.error('Error parsing subscription:', e);
            }
        }
    }

    await Promise.all(notifications);
    console.log(`Sent ${notifications.length} push notifications`);
});

/**
 * HTTP endpoint to get VAPID public key
 */
export const getVapidPublicKey = onRequest({ cors: true }, (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});

import { onSchedule } from 'firebase-functions/v2/scheduler';
import * as nodemailer from 'nodemailer';

// Configure Nodemailer transporter (Gmail)
// IMPORTANT: For Gmail, you might need an App Password if 2FA is enabled.
// Best practice: Use environment variables: defineString('GMAIL_USER')
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.GMAIL_USER || 'tu-email@gmail.com',
        pass: process.env.GMAIL_PASS || 'tu-password'
    }
});

/**
 * Scheduled task to check for birthdays and anniversaries
 * Runs every day at 09:00 AM (Europe/Madrid)
 */
export const checkSpecialDates = onSchedule({
    schedule: '0 9 * * *',
    timeZone: 'Europe/Madrid',
}, async (event) => {
    console.log('Checking special dates (Birthdays & Anniversaries)...');

    const now = new Date();
    const currentMonth = now.getMonth() + 1; // 1-12
    const currentDay = now.getDate();

    try {
        const studentsSnapshot = await admin.firestore().collection('students').where('active', '==', true).get();
        const promises: Promise<any>[] = [];

        studentsSnapshot.forEach(doc => {
            const student = doc.data();

            // Check Birthday
            if (student.birthDate) {
                const birthDate = new Date(student.birthDate);
                // Handle date parsing carefully if format varies, ideally it's ISO YYYY-MM-DD
                const birthMonth = birthDate.getMonth() + 1;
                const birthDay = birthDate.getDate();

                if (birthMonth === currentMonth && birthDay === currentDay) {
                    console.log(`🎂 It's ${student.name}'s birthday!`);
                    if (student.email) {
                        promises.push(sendBirthdayEmail(student.email, student.name));
                    }
                }
            }

            // Check Anniversary
            if (student.enrollmentDate) {
                const enrollDate = new Date(student.enrollmentDate);
                const enrollMonth = enrollDate.getMonth() + 1;
                const enrollDay = enrollDate.getDate();
                const years = now.getFullYear() - enrollDate.getFullYear();

                if (enrollMonth === currentMonth && enrollDay === currentDay && years > 0) {
                    console.log(`💃 It's ${student.name}'s ${years} year anniversary!`);
                    if (student.email) {
                        promises.push(sendAnniversaryEmail(student.email, student.name, years));
                    }
                }
            }
        });

        await Promise.all(promises);
        console.log(`Processed ${promises.length} special date emails.`);

    } catch (error) {
        console.error('Error checking special dates:', error);
    }
});

async function sendBirthdayEmail(email: string, name: string) {
    const mailOptions = {
        from: '"Xen Dance Space" <info@xendance.space>',
        to: email,
        subject: '¡Feliz Cumpleaños! 🎂 Regalo dentro...',
        html: `
            <div style="font-family: sans-serif; text-align: center; color: #333;">
                <h1 style="color: #6b21a8;">¡Feliz Cumpleaños, ${name.split(' ')[0]}! 🎉</h1>
                <p>Desde Xen Dance Space queremos desearte un día lleno de ritmo y alegría.</p>
                <div style="background-color: #f3e8ff; padding: 20px; border-radius: 10px; margin: 20px 0;">
                    <p style="font-weight: bold; margin: 0;">Tu Regalo:</p>
                    <h2 style="color: #6b21a8; margin: 10px 0;">10% DTO</h2>
                    <p style="margin: 0;">En tu próxima camiseta o sudadera oficial.</p>
                    <small>Enséñale este email a tu profe en recepción.</small>
                </div>
                <p>¡Que el ritmo no pare!</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}

async function sendAnniversaryEmail(email: string, name: string, years: number) {
    const mailOptions = {
        from: '"Xen Dance Space" <info@xendance.space>',
        to: email,
        subject: `¡${years} año${years > 1 ? 's' : ''} bailando juntos! 💃`,
        html: `
            <div style="font-family: sans-serif; text-align: center; color: #333;">
                <h1 style="color: #db2777;">¡Feliz Aniversario, ${name.split(' ')[0]}!</h1>
                <p>Hoy hace <strong>${years} año${years > 1 ? 's' : ''}</strong> que empezaste tu aventura en Xen Dance Space.</p>
                <p>Gracias por tu energía, tu esfuerzo y por cada paso que has dado con nosotros.</p>
                <p>¡A por muchos más bailes! 👯‍♀️</p>
            </div>
        `
    };
    return transporter.sendMail(mailOptions);
}
