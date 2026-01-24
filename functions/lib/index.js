"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getVapidPublicKey = exports.onNewActivityLog = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const https_1 = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
const webpush = require("web-push");
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
exports.onNewActivityLog = (0, firestore_1.onDocumentCreated)('activityLogs/{logId}', async (event) => {
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
    const notifications = [];
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
                notifications.push(webpush.sendNotification(subscription, payload)
                    .catch((error) => {
                    console.error('Error sending notification:', error);
                    if (error.statusCode === 410) {
                        return admin.firestore()
                            .collection('userProfiles')
                            .doc(doc.id)
                            .update({ pushSubscription: admin.firestore.FieldValue.delete() });
                    }
                    return null;
                }));
            }
            catch (e) {
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
exports.getVapidPublicKey = (0, https_1.onRequest)({ cors: true }, (req, res) => {
    res.json({ publicKey: VAPID_PUBLIC_KEY });
});
//# sourceMappingURL=index.js.map