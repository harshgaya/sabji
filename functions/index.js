const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require('nodemailer');

var serviceAccount = require("./firebase_admin.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

/// for confirm email send email

exports.sendNotification = functions.firestore
  .document("order/{orderId}")
  .onCreate((snap, context) => {
    // console.log(snap.data());

    console.log(`user id ${snap.data()['userId']}`);
    const userId = snap.data()['userId'];
    const orderId = snap.data()['orderId'];
    const productName = snap.data()['productTitle'];
    const price = snap.data()['price'];
    const address = snap.data()['address'];
    const companyWhatsap = '8340328891';
    const weight = snap.data()['quantity'];

    return admin.firestore().collection('users').doc(userId).get().then((doc) => {

      var transporter = nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 465,
        secure: true,
        auth: {
          user: 'sabjitaja23@gmail.com',
          pass: 'mzwpaokbxckgeosl'
        }
      });
      var maillist = [
        `${doc.data()['email']}`,
        'rohitstricker@gmail.com',
      ];

      const mailOptions = {
        from: `Sabjitaja.in <sabjitaja23@gmail.com>`,
        to:maillist,
        subject: `Your order for ${productName} has been successfully placed orderId ${orderId}`,
        html: `<h1>ऑर्डर करने के लिए धन्यवाद !</h1>
         <p> आपका ऑर्डर हो चुका है। आपको आधा घंटे से 1 घंटे के अंदर में <b> प्रोडक्ट ${productName} (${weight} kg) </b>मिल जायेगा। </p>
         <br>आपका ऑर्डर आईडी है :<b> ${orderId} </b>
         <br><br> आपने इस address को चुना है :<b> ${address} </b>
         <br><br><p>किसी भी समस्या के लिए हमे संपर्क करे : <b> ${companyWhatsap} </b> </p>`
      };
      transporter.sendMail(mailOptions, (error, data) => {
        if (error) {
          console.log(error)
          return
        }
        console.log(`Sent email to ${doc.data()['email']}`);
      });
    }).catch(reason => {
      console.log(reason)
      res.send(reason)
    });


  });

exports.onOrderUpdate = functions.firestore
  .document('order/{orderId}')
  .onUpdate((change, context) => {
    // Get an object representing the document
    // e.g. {'name': 'Marie', 'age': 66}
    // const newValue = change.after.data();
    // // console.log(`new value ${newValue}`);
    // // console.log(`change ${newValue.name}`);
    // console.log(`doc name ${change.after.id}`);


    // console.log(`order status ${orderStatuss}`);

    const newValue = change.after.data();

    // ...or the previous value before this update
    const previousValue = change.before.data();

    // access a particular field as you would any JS property
    const newStatus = newValue.status;
    const prevStatus = previousValue.status;

    if (newStatus === prevStatus) {
      console.log('status did not change');
      return;
    } else {
      const orderStatuss = newValue.status;
      console.log('status has changed');

      const companyWhatsap = '8340328891';
      if (orderStatuss === 'Cancelled') {
        console.log(`order status is ${orderStatuss}`);
        return admin.firestore().collection('order').doc(change.after.id).get().then((doc) => {
          const userId = doc.data()['userId'];
          console.log(`user id ${userId}`);
          const productName = doc.data()['productTitle'];
          const weight = doc.data()['quantity'];
          const orderId = doc.data()['orderId'];
          admin.firestore().collection('users').doc(userId).get().then((doc) => {
            const userEmail = doc.data()['email'];

            var transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                user: 'sabjitaja23@gmail.com',
                pass: 'mzwpaokbxckgeosl'
              }
            });
            const mailOptions = {
              from: `Sabjitaja.in <sabjitaja23@gmail.com>`,
              to: doc.data()['email'],
              subject: `Your order cancel for ${productName} has been successfully cancelled orderId: ${orderId}`,
              html: `<h1>हमें खेद है, आपने ऑर्डर कैंसल किया !</h1>
             <p> आपका ऑर्डर कैंसल हो चुका है। आपने  <b> प्रोडक्ट ${productName} (${weight} kg) </b>को कैंसल किया है </p>
             <br>आपका ऑर्डर आईडी है :<b> ${orderId} </b>
            
             <br><br><p>किसी भी समस्या के लिए हमे संपर्क करे : <b> ${companyWhatsap} </b> </p>`
            };
            transporter.sendMail(mailOptions, (error, data) => {
              if (error) {
                console.log(error)
                return
              }
              console.log(`Sent email to ${doc.data()['email']}`);
            });
          });
        });
      }
      if (orderStatuss === 'Delivered') {
        console.log(`order status is ${orderStatuss}`);
        return admin.firestore().collection('order').doc(change.after.id).get().then((doc) => {
          const userId = doc.data()['userId'];
          const productName = doc.data()['productTitle'];
          const weight = doc.data()['quantity'];
          const orderId = doc.data()['orderId'];
          admin.firestore().collection('users').doc(userId).get().then((doc) => {
            const userEmail = doc.data()['email'];
            const deviceToken = doc.data()['token'];
            const payload = {
              notification: {
                title: `आपका ${productName} (${weight} kg) डिलीवर हो चुका है।`,
                body: 'ऑर्डर करने के लिए धन्यवाद!',


              },
              android: {
                ttl: 3600 * 1000,
                notification: {

                  imageUrl: 'https://firebasestorage.googleapis.com/v0/b/sabjitaja-45326.appspot.com/o/notificationImages%2Fdelivered.png?alt=media&token=2f31d357-f00e-449a-89bc-266bc60fa8ba',

                }
              },
              apns: {
                payload: {
                  aps: {
                    'mutable-content': 1
                  }
                },
                fcm_options: {
                  image: 'https://firebasestorage.googleapis.com/v0/b/sabjitaja-45326.appspot.com/o/notificationImages%2Fdelivered.png?alt=media&token=2f31d357-f00e-449a-89bc-266bc60fa8ba'
                }
              },
              token: deviceToken,
            };
            admin.messaging().send(payload);
            // admin.messaging().sendToDevice(token, payload);

            var transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                user: 'sabjitaja23@gmail.com',
                pass: 'mzwpaokbxckgeosl'
              }
            });
            const mailOptions = {
              from: `Sabjitaja.in <sabjitaja23@gmail.com>`,
              to: doc.data()['email'],
              subject: `Your product ${productName} has been successfully delivered orderId: ${orderId}`,
              html: `<h1>ऑर्डर करने के लिए धन्यवाद !</h1>
             <p> आपका  <b> प्रोडक्ट ${productName} (${weight} kg) </b>डिलीवर हो चुका है। </p>
             <br>आपका ऑर्डर आईडी है :<b> ${orderId} </b>
             <br><br><p>किसी भी समस्या के लिए हमे संपर्क करे : <b> ${companyWhatsap} </b> </p>`
            };
            transporter.sendMail(mailOptions, (error, data) => {
              if (error) {
                console.log(error)
                return
              }
              console.log(`Sent email to ${doc.data()['email']}`);
            });
          });
        });
      }
      if (orderStatuss === 'Out For Delivery') {
        console.log(`order status is ${orderStatuss}`);
        return admin.firestore().collection('order').doc(change.after.id).get().then((doc) => {
          const userId = doc.data()['userId'];
          const productName = doc.data()['productTitle'];
          const weight = doc.data()['quantity'];
          const orderId = doc.data()['orderId'];
          admin.firestore().collection('users').doc(userId).get().then((doc) => {
            const userEmail = doc.data()['email'];
            const deviceToken = doc.data()['token'];
            const payload = {
              notification: {
                title: `Out For Delivery`,
                body: `आपका ${productName} डिलीवर होने वाला है।`,


              },
              android: {
                ttl: 3600 * 1000,
                notification: {

                  imageUrl: 'https://firebasestorage.googleapis.com/v0/b/sabjitaja-45326.appspot.com/o/notificationImages%2FWhatsApp%20Image%202023-02-18%20at%206.29.39%20PM.jpeg?alt=media&token=a400281d-481f-4534-b82b-2a1c9339fd14',

                }
              },
              apns: {
                payload: {
                  aps: {
                    'mutable-content': 1
                  }
                },
                fcm_options: {
                  image: 'https://firebasestorage.googleapis.com/v0/b/sabjitaja-45326.appspot.com/o/notificationImages%2FWhatsApp%20Image%202023-02-18%20at%206.29.39%20PM.jpeg?alt=media&token=a400281d-481f-4534-b82b-2a1c9339fd14'
                }
              },
              token: deviceToken,
            };
            admin.messaging().send(payload);
            // admin.messaging().sendToDevice(token, payload);

            var transporter = nodemailer.createTransport({
              host: 'smtp.gmail.com',
              port: 465,
              secure: true,
              auth: {
                user: 'sabjitaja23@gmail.com',
                pass: 'mzwpaokbxckgeosl'
              }
            });
            const mailOptions = {
              from: `Sabjitaja.in <sabjitaja23@gmail.com>`,
              to: doc.data()['email'],
              subject: `Your product ${productName} is out for delivery orderId: ${orderId}`,
              html: `<h1>ऑर्डर करने के लिए धन्यवाद !</h1>
             <p> आपका  <b> प्रोडक्ट ${productName} (${weight} kg) </b>डिलीवर होने वाला है। </p>
             <br>आपका ऑर्डर आईडी है :<b> ${orderId} </b>
             <br><br><p>किसी भी समस्या के लिए हमे संपर्क करे : <b> ${companyWhatsap} </b> </p>`
            };
            transporter.sendMail(mailOptions, (error, data) => {
              if (error) {
                console.log(error)
                return
              }
              console.log(`Sent email to ${doc.data()['email']}`);
            });
          });
        });
      }
    }


    return;
  });

exports.sendNotificationToAll = functions.firestore
  .document("notification/{notif}")
  .onCreate((snap, context) => {
    // console.log(snap.data());



    const payload = {
      notification: {
        title: snap.data()['title'],
        body: snap.data()['subtitle'],


      },
      android: {
        ttl: 3600 * 1000,
        notification: {

          imageUrl: snap.data()['image'],

        }
      },
      apns: {
        payload: {
          aps: {
            'mutable-content': 1
          }
        },
        fcm_options: {
          image: snap.data()['image']
        }
      },
      topic: 'sabjitaja'

    };


    return admin.messaging().send(payload);

  });
