from rest_framework.pagination import PageNumberPagination
from rest_framework.response import Response


class StandardResultsSetPagination(PageNumberPagination):
    """
    Custom pagination class for standard result sets.
    
    This pagination class provides a consistent pagination format across
    all API endpoints, including additional metadata like total pages
    and current page number.
    
    Attributes:
        page_size (int): The default number of items per page
        page_size_query_param (str): The query parameter to override page size
        max_page_size (int): The maximum allowed page size
    """
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100
    
    def get_paginated_response(self, data):
        """
        Return a paginated response with enhanced metadata.
        
        This method overrides the default pagination response to include
        additional information like total pages and current page number.
        
        Args:
            data (list): The paginated data to return
            
        Returns:
            Response: A Response object with pagination metadata
        """
        return Response({
            'count': self.page.paginator.count,
            'total_pages': self.page.paginator.num_pages,
            'current_page': self.page.number,
            'next': self.get_next_link(),
            'previous': self.get_previous_link(),
            'results': data
        })