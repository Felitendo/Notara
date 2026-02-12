import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:timezone/timezone.dart' as tz;
import 'package:timezone/data/latest_all.dart' as tz;

class NotificationService {
  NotificationService._();
  static final NotificationService instance = NotificationService._();

  final FlutterLocalNotificationsPlugin _plugin =
      FlutterLocalNotificationsPlugin();
  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    tz.initializeTimeZones();

    const androidSettings = AndroidInitializationSettings('@mipmap/ic_launcher');
    const iosSettings = DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const settings = InitializationSettings(
      android: androidSettings,
      iOS: iosSettings,
    );

    await _plugin.initialize(
      settings,
      onDidReceiveNotificationResponse: _onNotificationTapped,
    );

    _initialized = true;
  }

  void _onNotificationTapped(NotificationResponse response) {
    // Could navigate to the note via the payload (note ID)
    // For now, just open the app
  }

  /// Schedule a reminder notification for a note
  Future<void> scheduleReminder({
    required String noteId,
    required String title,
    required DateTime reminderAt,
  }) async {
    if (!_initialized) await initialize();

    // Cancel any existing notification for this note
    await cancelReminder(noteId);

    // Don't schedule if the time is in the past
    if (reminderAt.isBefore(DateTime.now())) return;

    final id = noteId.hashCode.abs() % 2147483647; // Ensure valid int32

    await _plugin.zonedSchedule(
      id,
      title.isNotEmpty ? title : 'Reminder',
      'You have a reminder for this note',
      tz.TZDateTime.from(reminderAt, tz.local),
      const NotificationDetails(
        android: AndroidNotificationDetails(
          'note_reminders',
          'Note Reminders',
          channelDescription: 'Reminders for your notes',
          importance: Importance.high,
          priority: Priority.high,
        ),
        iOS: DarwinNotificationDetails(
          presentAlert: true,
          presentBadge: true,
          presentSound: true,
        ),
      ),
      androidScheduleMode: AndroidScheduleMode.inexactAllowWhileIdle,
      payload: noteId,
    );
  }

  /// Cancel a scheduled reminder for a note
  Future<void> cancelReminder(String noteId) async {
    if (!_initialized) await initialize();

    final id = noteId.hashCode.abs() % 2147483647;
    await _plugin.cancel(id);
  }
}
