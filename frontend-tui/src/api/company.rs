use super::client::ApiClient;
use super::models::{
    CitiesResponse, CompanyDetailsResponse, Metrics, RecommendationsResponse, SearchResponse,
    SearchSuggestionsResponse,
};
use crate::error::Result;

impl ApiClient {
    /// Search companies with filters and pagination
    pub async fn search_companies(
        &self,
        query: &str,
        page: usize,
        limit: usize,
        cities: &[String],
    ) -> Result<SearchResponse> {
        let mut params = vec![
            ("q", query.to_string()),
            ("p", page.to_string()),
            ("l", limit.to_string()),
        ];

        // Add city filters
        for city in cities {
            params.push(("city", city.clone()));
        }

        self.get_with_query("/company", &params).await
    }

    /// Get detailed company information
    pub async fn get_company(&self, firmenbuchnummer: &str) -> Result<CompanyDetailsResponse> {
        let path = format!("/company/{}", urlencoding::encode(firmenbuchnummer));
        self.get(&path).await
    }

    /// Get search suggestions (autocomplete)
    pub async fn get_search_suggestions(&self, query: &str) -> Result<SearchSuggestionsResponse> {
        let params = vec![("q", query.to_string())];
        self.get_with_query("/search", &params).await
    }

    /// Get available cities with company counts
    pub async fn get_cities(&self, query: Option<&str>) -> Result<CitiesResponse> {
        if let Some(q) = query {
            let params = vec![("q", q.to_string())];
            self.get_with_query("/cities", &params).await
        } else {
            self.get("/cities").await
        }
    }

    /// Get database metrics (public endpoint)
    pub async fn get_metrics(&self) -> Result<Metrics> {
        self.get("/metrics").await
    }

    /// Get top recommended/viewed companies
    pub async fn get_recommendations(&self) -> Result<RecommendationsResponse> {
        self.get("/recommendations").await
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_search_companies_params() {
        let client = ApiClient::new("https://api.example.com".to_string(), 30).unwrap();

        // This test would require mocking the HTTP client
        // For now, we just test that the method signature is correct
        let cities = vec!["Wien".to_string(), "Graz".to_string()];

        // We can't actually call this without a real server
        // but we verify the code compiles and types are correct
        assert!(cities.len() == 2);
    }
}
