from client import ZeepClient
from xml_parse import extract_bilanz_fields
import json

from dotenv import load_dotenv
import os
load_dotenv()
API_KEY = os.getenv("API_KEY")
WSDL_URL = os.getenv("WSDL_URL")

client = ZeepClient(API_KEY, WSDL_URL)
urkunde_response = client.search_urkunde_by_fnr("563319k")
urkunde_response_xmls = [urkunde for urkunde in urkunde_response if urkunde.KEY.endswith('XML')]
latest_urkunde = urkunde_response_xmls[-1].KEY
# urkunde_content = client.get_urkunde(latest_urkunde)
# urkunde_content = client.get_urkunde('056247_5690452507182_000___000_30_36803752_XML')
urkunde_content = client.get_urkunde('563319_0070752553502_000___000_30_36887434_XML')
content = urkunde_content.DOKUMENT.CONTENT
if isinstance(content, bytes):
    xml_content = content.decode('utf-8')
else:
    xml_content = str(content)
# with open(f'urkunde_1.xml', 'w', encoding='utf-8') as f:
#     f.write(xml_content)
extracted_data = extract_bilanz_fields(xml_content)
print(extracted_data)
# json_output = json.dumps(extracted_data, indent=2, ensure_ascii=False)
# with open('extracted_data.json', 'w', encoding='utf-8') as f:
#     f.write(json_output)
client.close()