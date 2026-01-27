from rest_framework.decorators import api_view
from rest_framework.response import Response
from rest_framework import status
from django.db import connection
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiExample
from drf_spectacular.types import OpenApiTypes


@extend_schema(
    summary="Health Check",
    description="Check if the API and database are running properly",
    responses={
        200: {
            "type": "object",
            "properties": {
                "status": {"type": "string"},
                "message": {"type": "string"},
                "database": {"type": "string"},
                "version": {"type": "string"}
            }
        }
    }
)
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


@extend_schema(
    summary="Add Two Numbers",
    description="Add two numbers together and return the result",
    request={
        "type": "object",
        "properties": {
            "a": {
                "type": "number",
                "description": "First number",
                "example": 5
            },
            "b": {
                "type": "number", 
                "description": "Second number",
                "example": 10
            }
        },
        "required": ["a", "b"]
    },
    examples=[
        OpenApiExample(
            'Add 5 + 10',
            value={'a': 5, 'b': 10},
            request_only=True
        ),
        OpenApiExample(
            'Add 15 + 27',
            value={'a': 15, 'b': 27},
            request_only=True
        )
    ],
    responses={
        200: {
            "type": "object",
            "properties": {
                "a": {"type": "number"},
                "b": {"type": "number"},
                "result": {"type": "number"},
                "operation": {"type": "string"}
            }
        },
        400: {
            "type": "object",
            "properties": {
                "error": {"type": "string"}
            }
        }
    }
)
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

