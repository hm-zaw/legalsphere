from flask import Blueprint, request, jsonify
from datetime import datetime

from kafka_config import kafka_service
from mongodb_client import get_db_collection
from db.court_events import CourtEvent
from .lawyer import lawyer_token_required


court_events_bp = Blueprint('court_events', __name__)


@court_events_bp.route('/api/lawyer/court-events', methods=['POST'])
@lawyer_token_required
def create_court_event():
    try:
        payload = request.get_json() or {}

        case_id = payload.get('case_id')
        client_id = payload.get('client_id')
        title = payload.get('title')
        event_type = payload.get('event_type')
        scheduled_at = payload.get('scheduled_at')
        location = payload.get('location', '')
        notes = payload.get('notes', '')

        lawyer_id = str(getattr(request, 'user_id', ''))
        if not lawyer_id:
            return jsonify({'error': 'Invalid authentication - user ID missing'}), 401

        try:
            doc = CourtEvent.create(
                case_id=case_id,
                lawyer_id=lawyer_id,
                client_id=client_id,
                title=title,
                event_type=event_type,
                scheduled_at=scheduled_at,
                location=location,
                notes=notes,
            )
        except ValueError as ve:
            return jsonify({'error': str(ve)}), 400

        # Publish client notification
        try:
            now_iso = datetime.utcnow().isoformat()
            case_col = get_db_collection('case_requests')
            case_doc = case_col.find_one({'id': str(case_id)}) if case_id else None
            case_title = (case_doc or {}).get('case', {}).get('title', 'Untitled Case')

            notification_payload = {
                'clientId': client_id,
                'caseId': str(case_id),
                'notificationType': 'court_date_scheduled',
                'title': 'Court Event Scheduled',
                'message': f'"{title}" has been scheduled for case "{case_title}".',
                'metadata': {
                    'eventId': doc.get('id'),
                    'eventType': event_type,
                    'scheduledAt': scheduled_at,
                    'location': location,
                    'lawyerId': lawyer_id,
                    'lawyerName': getattr(request, 'user_name', None),
                },
                'timestamp': now_iso,
                'user_id': client_id,
            }
            kafka_service.publish_notification(notification_payload)
        except Exception:
            pass

        return jsonify({'success': True, 'event': CourtEvent.serialize_for_response(doc)}), 201

    except Exception as e:
        return jsonify({'success': False, 'error': f'Internal server error: {str(e)}'}), 500


@court_events_bp.route('/api/lawyer/calendar', methods=['GET'])
@lawyer_token_required
def get_lawyer_calendar():
    try:
        start_date = request.args.get('start_date')
        end_date = request.args.get('end_date')

        if not start_date or not end_date:
            return jsonify({'error': 'start_date and end_date are required'}), 400

        lawyer_id = str(getattr(request, 'user_id', ''))
        if not lawyer_id:
            return jsonify({'error': 'Invalid authentication - user ID missing'}), 401

        # Accepted appointments
        appt_col = get_db_collection('appointments')
        appt_query = {
            'lawyer_id': lawyer_id,
            'status': 'accepted',
            'agreed_time': {'$gte': str(start_date), '$lte': str(end_date)},
        }
        appointments = list(appt_col.find(appt_query).sort('agreed_time', 1))

        # Court events
        court_events = CourtEvent.list_by_lawyer_between(lawyer_id, start_date, end_date)

        normalized = []

        for apt in appointments:
            normalized.append({
                'source': 'appointment',
                'id': str(apt.get('appointment_id') or apt.get('_id')),
                'case_id': apt.get('case_id'),
                'client_id': apt.get('client_id'),
                'lawyer_id': apt.get('lawyer_id'),
                'title': 'Appointment',
                'event_type': 'appointment',
                'scheduled_at': apt.get('agreed_time'),
                'location': apt.get('location_type', ''),
                'notes': '',
            })

        for ev in court_events:
            ev_ser = CourtEvent.serialize_for_response(ev)
            normalized.append({
                'source': 'court_event',
                'id': ev_ser.get('id'),
                'case_id': ev_ser.get('case_id'),
                'client_id': ev_ser.get('client_id'),
                'lawyer_id': ev_ser.get('lawyer_id'),
                'title': ev_ser.get('title'),
                'event_type': ev_ser.get('event_type'),
                'scheduled_at': ev_ser.get('scheduled_at'),
                'location': ev_ser.get('location'),
                'notes': ev_ser.get('notes'),
            })

        normalized.sort(key=lambda x: x.get('scheduled_at') or '')

        return jsonify({'success': True, 'events': normalized}), 200

    except Exception as e:
        return jsonify({'success': False, 'error': f'Internal server error: {str(e)}'}), 500
