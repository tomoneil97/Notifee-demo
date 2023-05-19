import notifee, {
    AuthorizationStatus,
    EventType,
    Notification, //these are the only modules we need for now
    TimestampTrigger,
    TriggerType,
} from "@notifee/react-native";
import * as RootNavigation from './RootNavigation';

class Notifications {

    public async scheduleNotification({
        reminder,
        date,
    }: {
        reminder: string;
        date: Date;
    }) {
        //check if the user has given the permission to send notificaitons:
        const hasPermissions = await this.checkPermissions();

        //if yes, schedule the notification!

        if (hasPermissions) {
            //build a trigger (with a timestamp!)
            const trigger: TimestampTrigger = {
                type: TriggerType.TIMESTAMP, //can also do interval. timestamp suits the needs of call it better.
                timestamp: +date, // + converts the date to a compatible timestamp.
            };

            //create the deets for the notification
            const notificationDetails = {
                id: '1',
                title: `It\'s time to check in for - ${reminder} ! 📋`,
                body: 'Tap to check in',
                android: { //Android requires you to give the notification a type so that it can be sorted by the OS.
                    channelId: 'reminder',
                    pressAction: {
                        id: 'default',
                    },
                },
                data: {
                    id: '1',
                    action: 'reminder',
                    details: {
                        name: reminder,
                        date: date.toString(),
                    },
                },
            };
            //We've built it, now let's schedule it!
            await notifee.createTriggerNotification(
                notificationDetails,
                trigger,
            );
        }
    }



    constructor() {
        //Bootstrap method is called when the app is launched via a notification
        this.bootstrap();

        //listen out for events. Event listener
        //Basically, foreground event is how it behaves if the app is in use (foreground)
        notifee.onForegroundEvent(({ type, detail}) => {
            switch (type) {
                //the user will do one of two things.... dismiss it or press it!
                //But there are plenty of other things you can do too in EventType, such as iOS blocked delivery, or delivery successful, for example.
                case EventType.DISMISSED:
                    //we don't really care about what happens here.
                    console.log('user dismissed the notification', detail.notification);
                    break;
                case EventType.PRESS:
                    //Fetch the details from detail.notification.data property.
                    //we then need to pass the notifiation to the handleNotificationOpen method.
                    this.handleNotificationOpen(detail.notification as Notification);
                    console.log('user pressed the notification', detail.notification);
                    break;
                
            }
        });
        //and if the app is in the background, we'll behave like this instead! Event listener.

        notifee.onBackgroundEvent( async ({ type, detail }) => {
            const { notification } = detail;
            console.log('Notification received: background', type, detail);
            if (notification) {
                this.handleNotificationOpen(notification);
            }
        });
    }

    //if the user clicks on the notification, run this:
    public handleNotificationOpen(notification: Notification) {
        const { data } = notification
        RootNavigation.navigate('Detail', {savedReminder: data?.details});
        console.log('Notification opened by user', data);
    }

    //If we launch the app because of a notification, do this:

    public async bootstrap() {
        const initialNotification = await notifee.getInitialNotification(); //fetches the notification that causes the app to open.
        if (initialNotification) {
            this.handleNotificationOpen(initialNotification.notification);
        }
    }

    //iOS is picky. Do we have permission to be doing this?
    public async checkPermissions() {
        const settings = await notifee.requestPermission();
        
        if (settings.authorizationStatus >= AuthorizationStatus.AUTHORIZED) //numeric so can use arithmetic comparison.
        {
            console.log('Permission settings: ', settings);
            return true;
        }
        else {
            console.log('User declined permissions');
            return false;
        }
    }
}

// Exporting an instance of the class
export default new Notifications(); //singleton class. Important so that we always have full context & don't accidentally make a new instance.