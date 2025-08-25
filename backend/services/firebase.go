package services

import (
    "context"
    "log"
    "os"
    "sync"
    "firebase.google.com/go"
    "google.golang.org/api/option"
)

var (
    firebaseApp *firebase.App
    firebaseOnce sync.Once
    firebaseErr error
)

// GetFirebaseApp returns a singleton Firebase app instance
func GetFirebaseApp() (*firebase.App, error) {
    firebaseOnce.Do(func() {
        var opts []option.ClientOption
        
        // Check if service account key file exists
        if _, err := os.Stat("serviceAccountKey.json"); err == nil {
            log.Println("Using serviceAccountKey.json for Firebase initialization")
            opts = append(opts, option.WithCredentialsFile("serviceAccountKey.json"))
        } else {
            log.Println("serviceAccountKey.json not found")
            
            // Check for environment variable
            if credFile := os.Getenv("GOOGLE_APPLICATION_CREDENTIALS"); credFile != "" {
                log.Printf("Using GOOGLE_APPLICATION_CREDENTIALS: %s", credFile)
                opts = append(opts, option.WithCredentialsFile(credFile))
            } else {
                log.Println("No credentials file found, using default application credentials")
                // This will work if running on Google Cloud or with gcloud auth
            }
        }
        
        // Initialize Firebase app
        if len(opts) > 0 {
            firebaseApp, firebaseErr = firebase.NewApp(context.Background(), nil, opts...)
        } else {
            firebaseApp, firebaseErr = firebase.NewApp(context.Background(), nil)
        }
        
        if firebaseErr != nil {
            log.Printf("Firebase initialization error: %v", firebaseErr)
        } else {
            log.Println("Firebase app initialized successfully")
        }
    })
    return firebaseApp, firebaseErr
}
