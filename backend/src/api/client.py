from zeep import Client
from zeep.transports import Transport
from requests import Session
from datetime import date
import os
import threading

# Global SOAP client instance and lock for thread-safety
_global_zeep_client = None
_client_lock = threading.Lock()

class ZeepClient:
    def __init__(self, API_KEY, WSDL_URL):
        self.API_KEY = API_KEY
        self.WSDL_URL = WSDL_URL
        self.session = None
        self.transport = None
        self.client = self._create_client()

    def _create_client(self):
        """
        Create a client for the WSDL URL
        """
        self.session = Session()
        self.session.headers.update({'X-API-KEY': f'{self.API_KEY}', 'Content-Type': 'application/soap+xml;charset=UTF-8'})
        # Configure session timeout
        self.session.timeout = (10, 30)  # (connect timeout, read timeout)
        self.transport = Transport(session=self.session, timeout=30, operation_timeout=30)
        client = Client(wsdl=self.WSDL_URL, transport=self.transport)
        for service in client.wsdl.services.values():
            for port in service.ports.values():
                port.binding_options['address'] = "https://justizonline.gv.at/jop/api/at.gv.justiz.fbw/ws"

        return client

    def _print_services(self):
        """
        Print the services available in the client
        """
        for service in self.client.wsdl.services.values():
            for port in service.ports.values():
                print(f"  Port: {port.name}")
                print(f"  Address: {port.binding_options['address']}")
                operations = port.binding._operations
                for operation in operations.values():
                    print(f"Method: {operation.name}")
                    print(f"Input: {operation.input.signature()}")
                    print(f"Output: {operation.output.signature()}")
                    print("-" * 40)


    def search_urkunde_by_fnr(self, fnr):
        """
        Search for the latest urkunde by fnr and return the response
        Args:
            fnr: the fnr of the company
        Returns:
            urkunde_response: the response from the search_urkunde_by_fnr function
        """
        try:
            urkunde_response = self.client.service.SUCHEURKUNDE(FNR=fnr)
            return urkunde_response.ERGEBNIS
        except Exception as e:
            # Silently handle errors
            return None
    
    def get_urkunde(self, key):
        """
        Get the content of the urkunde and return the extracted data
        Args:
            key: the key of the urkunde
        Returns:
            extracted_data: the extracted data from the urkunde
        """
        if not key.endswith('XML'):
            return None
        try:
            response = self.client.service.URKUNDE(KEY=key)
            return response

        except Exception as e:
            # Silently handle errors
            return None
        
    def close(self):
        """
        Close the client and clean up resources.
        Note: When using get_shared_client(), this method should not be called
        as the shared client is reused across requests.
        """
        try:
            if self.session is not None:
                self.session.close()
                self.session = None
            if self.transport is not None:
                self.transport = None
            if self.client is not None:
                self.client = None
        except Exception:
            # Silently handle errors during cleanup
            pass


def get_shared_client():
    """
    Get or create a shared SOAP client instance (singleton pattern).
    This client is reused across requests for better performance.
    Thread-safe implementation.

    Returns:
        ZeepClient: Shared SOAP client instance
    """
    global _global_zeep_client

    # Double-checked locking pattern for performance
    if _global_zeep_client is None:
        with _client_lock:
            # Check again inside lock to prevent race condition
            if _global_zeep_client is None:
                api_key = os.getenv("API_KEY")
                wsdl_url = os.getenv("WSDL_URL")

                if not api_key or not wsdl_url:
                    raise ValueError("API_KEY and WSDL_URL environment variables must be set")

                _global_zeep_client = ZeepClient(api_key, wsdl_url)

    return _global_zeep_client