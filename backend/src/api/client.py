from zeep import Client
from zeep.transports import Transport
from requests import Session
from datetime import date
import os

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
        self.transport = Transport(session=self.session)
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
        print(f"Searching for documents with FNR: {fnr}")
        try:
            urkunde_response = self.client.service.SUCHEURKUNDE(FNR=fnr)
            return urkunde_response.ERGEBNIS
        except Exception as e:
            print(f"Error during SUCHEURKUNDE for FNR {fnr}: {e}")
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
            print(f"Key {key} does not end with .xml")
            return None
        print(f"Getting urkunde with KEY: {key}")
        try:
            response = self.client.service.URKUNDE(KEY=key)

            with open(f'{key}_urkunde.json', "w", encoding="utf-8") as f:
                f.write(str(response))

            return response

        except Exception as e:
            print(f"Error calling URKUNDE for KEY {key}: {e}")
            return None
        
    def close(self):
        """
        Close the client and clean up resources
        """
        try:
            if self.session is not None:
                self.session.close()
                self.session = None
            if self.transport is not None:
                self.transport = None
            if self.client is not None:
                self.client = None
        except Exception as e:
            print(f"Error closing client: {e}")