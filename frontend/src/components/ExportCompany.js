export async function exportCompanySummary(companyId) {
  try {
    const response = await fetch(
      `https://apibizray.bnbdevelopment.hu/api/v1/company/${companyId}/export`,
      { method: 'GET' }
    );

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Company not found');
      }
      throw new Error(`Failed to export: ${response.status} ${response.statusText}`);
    }

    const blob = await response.blob();
    
    const contentDisposition = response.headers.get('Content-Disposition');
    const filename = contentDisposition
      ? contentDisposition.split('filename=')[1].replace(/"/g, '')
      : `${companyId}_summary.pdf`;

    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    return { success: true, filename };
  } catch (error) {
    return { success: false, error: error.message };
  }
}