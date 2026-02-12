import 'package:flutter/material.dart';
import 'package:intl/intl.dart';
import 'package:lucide_icons/lucide_icons.dart';

class ReminderPicker extends StatelessWidget {
  final DateTime? currentReminder;
  final ValueChanged<DateTime?> onReminderChanged;

  const ReminderPicker({
    super.key,
    this.currentReminder,
    required this.onReminderChanged,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final now = DateTime.now();
    final isOverdue =
        currentReminder != null && currentReminder!.isBefore(now);

    // Presets
    final laterToday = now.hour < 18
        ? DateTime(now.year, now.month, now.day, 18)
        : null;
    final tomorrowMorning = DateTime(now.year, now.month, now.day + 1, 8);
    final tomorrowEvening = DateTime(now.year, now.month, now.day + 1, 18);
    // Next Monday at 8am
    final daysUntilMonday = (DateTime.monday - now.weekday + 7) % 7;
    final nextMondayDays = daysUntilMonday == 0 ? 7 : daysUntilMonday;
    final nextMonday = DateTime(
      now.year,
      now.month,
      now.day + nextMondayDays,
      8,
    );

    return Container(
      decoration: BoxDecoration(
        color: theme.colorScheme.surface,
        borderRadius: const BorderRadius.vertical(top: Radius.circular(24)),
      ),
      child: SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Handle
            Center(
              child: Container(
                margin: const EdgeInsets.only(top: 12),
                width: 40,
                height: 4,
                decoration: BoxDecoration(
                  color: theme.colorScheme.onSurface.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ),

            // Header
            Padding(
              padding: const EdgeInsets.fromLTRB(24, 20, 24, 8),
              child: Row(
                children: [
                  Container(
                    width: 40,
                    height: 40,
                    decoration: BoxDecoration(
                      color: theme.colorScheme.primary.withValues(alpha: 0.1),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      LucideIcons.bell,
                      size: 20,
                      color: theme.colorScheme.primary,
                    ),
                  ),
                  const SizedBox(width: 12),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        'Reminder',
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        'Get notified at the right time',
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.hintColor,
                        ),
                      ),
                    ],
                  ),
                ],
              ),
            ),

            // Current reminder
            if (currentReminder != null)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 8),
                child: Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 12),
                  decoration: BoxDecoration(
                    color: isOverdue
                        ? theme.colorScheme.error.withValues(alpha: 0.1)
                        : theme.colorScheme.primary.withValues(alpha: 0.1),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Row(
                    children: [
                      Icon(
                        LucideIcons.bellRing,
                        size: 18,
                        color: isOverdue
                            ? theme.colorScheme.error
                            : theme.colorScheme.primary,
                      ),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              _formatReminder(currentReminder!),
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w600,
                                color: isOverdue
                                    ? theme.colorScheme.error
                                    : theme.colorScheme.primary,
                              ),
                            ),
                            if (isOverdue)
                              Text(
                                'Overdue',
                                style: theme.textTheme.bodySmall?.copyWith(
                                  color: theme.colorScheme.error,
                                ),
                              ),
                          ],
                        ),
                      ),
                      IconButton(
                        icon: Icon(
                          LucideIcons.x,
                          size: 18,
                          color: isOverdue
                              ? theme.colorScheme.error
                              : theme.colorScheme.primary,
                        ),
                        onPressed: () {
                          onReminderChanged(null);
                          Navigator.of(context).pop();
                        },
                        tooltip: 'Remove reminder',
                      ),
                    ],
                  ),
                ),
              ),

            const Divider(height: 1),

            // Presets
            if (laterToday != null)
              _PresetTile(
                icon: LucideIcons.clock,
                title: 'Later today',
                subtitle: _formatTime(laterToday),
                onTap: () {
                  onReminderChanged(laterToday);
                  Navigator.of(context).pop();
                },
              ),
            _PresetTile(
              icon: LucideIcons.sunrise,
              title: 'Tomorrow morning',
              subtitle: _formatTime(tomorrowMorning),
              onTap: () {
                onReminderChanged(tomorrowMorning);
                Navigator.of(context).pop();
              },
            ),
            _PresetTile(
              icon: LucideIcons.sunset,
              title: 'Tomorrow evening',
              subtitle: _formatTime(tomorrowEvening),
              onTap: () {
                onReminderChanged(tomorrowEvening);
                Navigator.of(context).pop();
              },
            ),
            _PresetTile(
              icon: LucideIcons.calendarDays,
              title: 'Next Monday',
              subtitle: _formatTime(nextMonday),
              onTap: () {
                onReminderChanged(nextMonday);
                Navigator.of(context).pop();
              },
            ),

            const Divider(height: 1),

            // Pick date & time
            _PresetTile(
              icon: LucideIcons.calendar,
              title: 'Pick date & time',
              onTap: () async {
                final date = await showDatePicker(
                  context: context,
                  initialDate: currentReminder ?? DateTime.now().add(const Duration(days: 1)),
                  firstDate: DateTime.now(),
                  lastDate: DateTime.now().add(const Duration(days: 365 * 5)),
                );
                if (date == null || !context.mounted) return;

                final time = await showTimePicker(
                  context: context,
                  initialTime: currentReminder != null
                      ? TimeOfDay.fromDateTime(currentReminder!)
                      : const TimeOfDay(hour: 8, minute: 0),
                );
                if (time == null || !context.mounted) return;

                final combined = DateTime(
                  date.year,
                  date.month,
                  date.day,
                  time.hour,
                  time.minute,
                );
                onReminderChanged(combined);
                Navigator.of(context).pop();
              },
            ),

            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }

  String _formatReminder(DateTime dt) {
    final now = DateTime.now();
    final tomorrow = DateTime(now.year, now.month, now.day + 1);

    if (dt.year == now.year && dt.month == now.month && dt.day == now.day) {
      return 'Today, ${DateFormat.jm().format(dt)}';
    }
    if (dt.year == tomorrow.year &&
        dt.month == tomorrow.month &&
        dt.day == tomorrow.day) {
      return 'Tomorrow, ${DateFormat.jm().format(dt)}';
    }
    return '${DateFormat.MMMd().format(dt)}, ${DateFormat.jm().format(dt)}';
  }

  String _formatTime(DateTime dt) {
    return DateFormat.jm().format(dt);
  }
}

class _PresetTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;

  const _PresetTile({
    required this.icon,
    required this.title,
    this.subtitle,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return ListTile(
      leading: Icon(icon, size: 20, color: theme.hintColor),
      title: Text(title, style: theme.textTheme.bodyMedium?.copyWith(
        fontWeight: FontWeight.w500,
      )),
      trailing: subtitle != null
          ? Text(
              subtitle!,
              style: theme.textTheme.bodySmall?.copyWith(color: theme.hintColor),
            )
          : null,
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 24),
    );
  }
}
