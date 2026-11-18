import unittest
from customer_portal_payload import validate_payload


def valid():
    return {'data': {'project': {'id': 'project-a', 'name': 'Fixture'},
        'customer_estimates': [{'total_amount': 1000, 'currency': 'EUR'}]}}


class CustomerPortalPayloadTests(unittest.TestCase):
    def test_customer_commercial_totals_are_allowed(self):
        validate_payload(valid(), 'project-a')

    def test_error_objects_are_not_finance_proof(self):
        for body in [{'error': 'Insufficient rights'}, {'data': None}, [], None]:
            with self.subTest(body=body), self.assertRaises(ValueError):
                validate_payload(body, 'project-a')

    def test_foreign_project_is_not_proof(self):
        with self.assertRaises(ValueError): validate_payload(valid(), 'project-b')

    def test_project_shape_required(self):
        for project in [{}, {'id': 'project-a'}, {'id': 'project-a', 'name': None}]:
            with self.subTest(project=project), self.assertRaises(ValueError):
                validate_payload({'data': {'project': project}}, 'project-a')

    def test_nested_finance_is_denied(self):
        for key in ['actual_amount', 'MARGIN', 'internal_cost_source', 'project_cost_items']:
            body = valid(); body['data']['nested'] = [{'safe': {key: 123}}]
            with self.subTest(key=key), self.assertRaises(ValueError): validate_payload(body, 'project-a')

    def test_error_alongside_data_is_denied(self):
        body = valid(); body['error'] = 'Failed'
        with self.assertRaises(ValueError): validate_payload(body, 'project-a')


if __name__ == '__main__': unittest.main()
