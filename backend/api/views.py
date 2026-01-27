from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection


@api_view(['GET'])
def health_check(request):
    """
    Health check endpoint to verify the API is running.
    Also checks database connectivity.
    """
    try:
        # Check database connection
        connection.ensure_connection()
        db_status = "connected"
    except Exception as e:
        db_status = f"error: {str(e)}"
    
    return Response({
        'status': 'healthy',
        'message': 'API is running',
        'database': db_status,
        'version': '1.0.0'
    })


@api_view(['POST'])
def add_numbers(request):
    """
    Add two numbers together.
    
    Request body:
    {
        "a": 5,
        "b": 10
    }
    
    Response:
    {
        "a": 5,
        "b": 10,
        "result": 15
    }
    """
    a = request.data.get('a')
    b = request.data.get('b')
    
    # Validate inputs
    if a is None or b is None:
        return Response(
            {
                'error': 'Both "a" and "b" parameters are required',
                'example': {'a': 5, 'b': 10}
            },
            status=status.HTTP_400_BAD_REQUEST
        )
    
    try:
        a = float(a)
        b = float(b)
        result = a + b
        
        return Response({
            'a': a,
            'b': b,
            'result': result,
            'operation': 'addition'
        })
    except (ValueError, TypeError):
        return Response(
            {
                'error': 'Both "a" and "b" must be valid numbers',
                'received': {'a': a, 'b': b}
            },
            status=status.HTTP_400_BAD_REQUEST
        )
