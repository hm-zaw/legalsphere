import uuid
from datetime import datetime
import logging
from mongodb_client import get_db_collection
from kafka_config import kafka_service

logger = logging.getLogger(__name__)

# Standard MMK constants
FEE_RETAINER = 150000
FEE_VIRTUAL_APPT = 50000
FEE_IN_PERSON_APPT = 100000
FEE_COURT_HEARING = 300000
FEE_DOCUMENT = 150000

def add_charge(case_id, description, amount, charge_type):
    """
    Appends a charge to the billing_ledger of a specific case and publishes a notification.
    """
    try:
        collection = get_db_collection('case_requests')
        
        charge = {
            'id': str(uuid.uuid4()),
            'date': datetime.utcnow().isoformat(),
            'description': description,
            'amount': amount,
            'type': charge_type
        }
        
        # Get the case to fetch client info for the notification
        case = collection.find_one({'id': case_id})
        if not case:
            logger.error(f"Case {case_id} not found when trying to add charge.")
            return None

        # Ensure billing_ledger exists
        if 'billing_ledger' not in case:
            collection.update_one({'id': case_id}, {'$set': {'billing_ledger': []}})

        # Append to billing_ledger array
        result = collection.update_one(
            {'id': case_id},
            {'$push': {'billing_ledger': charge}}
        )
        
        if result.modified_count > 0:
            client_id = case.get('client', {}).get('email')
            if not client_id:
                client_id = case.get('user', {}).get('email') or case.get('clientId') or 'unknown'

            # Publish notification
            kafka_payload = {
                'clientId': client_id,
                'caseId': case_id,
                'notificationType': 'new_charge_added',
                'amount': amount,
                'title': 'New Charge Added',
                'message': f"A charge of {amount:,} MMK has been added to your ledger for: {description}"
            }
            
            try:
                kafka_service.publish_case_notification(kafka_payload)
            except Exception as e:
                logger.error(f"Failed to publish billing notification: {e}")
                
            return charge
            
        return None
    except Exception as e:
        logger.error(f"Error adding charge: {e}")
        return None
