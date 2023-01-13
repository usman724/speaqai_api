const admin = require('firebase-admin');
const firestore = require('@google-cloud/firestore');
const express = require('express');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');
const cors = require('cors');

// const firebase = require('firebase');


// const appdata = firebase.initializeAppitial({
//     apiKey: "AIzaSyAg9BxfMLDPKuwz5gnqYi7GpsS-YVBUFUw",
//     authDomain: "speaqai.firebaseapp.com",
//     projectId: "speaqai",
//     storageBucket: "speaqai.appspot.com",
//     messagingSenderId: "552797581570",
//     appId: "1:552797581570:web:cbb3b220a2433c6505521b",
//     measurementId: "G-3X2ZJ0K485"
// })
// // Initialize Express
const app = express();
app.use(cors()); // Enable CORS for all routes

const serviceAccount = require("./serviceAccount.json");

admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    
    projectId: "speaqai",
});

// let db = new firestore.Firestore();


const { initializeApp } = require("firebase/app");
const { getFirestore } = require("firebase/firestore")
const { collection, addDoc,getDoc  ,doc, setDoc } = require("firebase/firestore"); 

// TODO: Replace the following with your app's Firebase project configuration
// See: https://firebase.google.com/docs/web/learn-more#config-object
const firebaseConfig = {
    apiKey: "AIzaSyAg9BxfMLDPKuwz5gnqYi7GpsS-YVBUFUw",
    authDomain: "speaqai.firebaseapp.com",
    projectId: "speaqai",
    storageBucket: "speaqai.appspot.com",
    messagingSenderId: "552797581570",
    appId: "1:552797581570:web:cbb3b220a2433c6505521b",
    measurementId: "G-3X2ZJ0K485"
};

// Initialize Firebase
const admindb = initializeApp(firebaseConfig);


// Initialize Cloud Firestore and get a reference to the service
const db = getFirestore(admindb);


//Parse incoming request bodies in a middleware before your handlers
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));



// app.post('/login', async (req, res) => {
  
  

//     const { email, password } = req.body;
//     try {
//       // Get the user's document from Firestore
//       const userRef = db.collection('users').where('email', '==', email).limit(1);
//       const userSnapshot = await userRef.get();
//       // If the user is found in Firestore
//       if (!userSnapshot.empty) {
//         const user = userSnapshot.docs[0].data();
//         // Compare the provided password with the hashed password stored in Firestore
//         const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
//         if (isPasswordValid) {
//           // Create a JSON web token (JWT) for the user
//           const token = await admin.auth().createCustomToken(userSnapshot.docs[0].id);
//           res.json({ token });
//         } else {
//           res.status(401).json({ message: 'Invalid email or password' });
//         }
//       } else {
//         res.status(401).json({ message: 'Invalid email or password' });
//       }
//     } catch (err) {
//       res.status(500).json({ message: 'Error logging in: ' + err });
//     }
//   });

  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        // Retrieve the user account from Firebase Authentication
        const userRecord = await admin.auth().getUserByEmail(email);
        // Get the user document from Firestore
        // const userDoc = await db.collection('users').doc(userRecord.uid).get();
        // const user = userDoc.data();


        const docRef = doc(db, "users", userRecord.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            console.log("Document data:", docSnap.data());

            let user=docSnap.data();
            
          // Compare the provided password with the hashed password stored in Firestore
          const passwordIsValid = await bcrypt.compare(password, user.passwordHash);
          if (!passwordIsValid) {
              return res.status(401).json({ message: 'Invalid email or password' });
          }
          // Create a JSON web token (JWT) for the user
          const token = await admin.auth().createCustomToken(userRecord.uid);
          // Send the JSON web token (JWT) to the client
    
          res.status(200).json({ token});

        } else {

          res.status(404).json({ message: 'Account not found !'});
        // doc.data() will be undefined in this case
        console.log("No such document!");
        }


    } catch (err) {
        res.status(500).json({ message: 'Error logging in: ' + err });
    }
});


  
app.post('/signup', async (req, res) => {
    const { email, password,name } = req.body;
     console.log("🚀 ~ file: index.js:140 ~ app.post ~ { email, password,name }", { email, password,name });
    try {
      // Hash the password
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);
      // Create the user account
     try {

      userRecord = await admin.auth().createUser({
        email: email
      });
      
      console.log('userRecord',userRecord);
     } catch (error) {
    //  console.log("🚀 ~ file: index.js:152 ~ app.post ~ error", error.code);
    
        if (error.code =="auth/email-already-exists") {
          res.status(404).json({ message: 'Email Already exists'});
          return;
        }

        if (error.code == "auth/invalid-email") {
          res.status(404).json({ message: 'invalid Email' });
          return;
        }
          
        res.status(404).json({ message: error.message });
        return;
    
   
     }
      // console.log("🚀 ~ file: index.js:149 ~ userRecord ~ userRecord", userRecord);
     


      try {
        
        // Add a new document in collection "cities"
        //console.log('Add a new document in collection "cities"',userRecord.uid);
        const docRef = await setDoc(doc(db, "users", userRecord.uid), {
          email: email,
          passwordHash:hashedPassword, 
          name:name
        });

      
      } catch (e) {
      //  console.log('Account not Created ',e);
        res.status(404).json({ message: 'Account not Created '});
        return;
      }

      

      // Create a JSON web token (JWT) for the user
       const token = await admin.auth().createCustomToken(userRecord.uid);
       console.log("🚀 ~ file: index.js:190 ~ app.post ~ token", token)
  
      // // Send the JSON web token (JWT) to the client
    
   
       res.status(200).json({ 
        token:token,
        message: 'Account Created '});

    } catch (err) {
      res.status(500).json({ message: 'Error creating user: ' + err });
    }
  });

  

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  
  console.log(`Server listening on port ${PORT}`);
});
