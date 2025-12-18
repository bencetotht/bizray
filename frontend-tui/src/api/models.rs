use chrono::NaiveDate;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;

// ============================================================================
// User and Authentication Models
// ============================================================================

#[derive(Debug, Deserialize, Serialize, Clone)]
pub struct User {
    pub id: i32,
    pub uuid: String,
    pub username: String,
    pub email: String,
    #[serde(rename = "user_role")]
    pub role: String,
    pub registered_at: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct AuthResponse {
    pub token: String,
    pub user: User,
}

#[derive(Debug, Serialize)]
pub struct LoginRequest {
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct RegisterRequest {
    pub username: String,
    pub email: String,
    pub password: String,
}

#[derive(Debug, Serialize)]
pub struct PasswordChangeRequest {
    pub current_password: String,
    pub new_password: String,
}

#[derive(Debug, Serialize)]
pub struct UsernameChangeRequest {
    pub username: String,
}

// ============================================================================
// Company Models
// ============================================================================

#[derive(Debug, Deserialize, Clone)]
pub struct Company {
    pub firmenbuchnummer: String,
    pub name: String,
    pub legal_form: Option<String>,
    pub business_purpose: Option<String>,
    pub seat: Option<String>,
    pub address: Option<Address>,
    #[serde(default)]
    pub partners: Vec<Partner>,
    #[serde(default)]
    pub registry_entries: Vec<RegistryEntry>,
    #[serde(rename = "riskScore")]
    pub risk_score: Option<f64>,
    #[serde(rename = "riskIndicators", default)]
    pub risk_indicators: HashMap<String, f64>,
    pub reference_date: Option<NaiveDate>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CompanySummary {
    pub firmenbuchnummer: String,
    pub name: String,
    pub legal_form: Option<String>,
    pub business_purpose: Option<String>,
    pub seat: Option<String>,
    #[serde(rename = "riskScore")]
    pub risk_score: Option<f64>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Address {
    pub street: Option<String>,
    pub house_number: Option<String>,
    pub postal_code: Option<String>,
    pub city: Option<String>,
    pub country: Option<String>,
}

impl Address {
    pub fn format_full(&self) -> String {
        let mut parts = Vec::new();

        if let Some(street) = &self.street {
            let mut addr = street.clone();
            if let Some(num) = &self.house_number {
                addr.push_str(&format!(" {}", num));
            }
            parts.push(addr);
        }

        if let Some(postal) = &self.postal_code {
            let mut line = postal.clone();
            if let Some(city) = &self.city {
                line.push_str(&format!(" {}", city));
            }
            parts.push(line);
        } else if let Some(city) = &self.city {
            parts.push(city.clone());
        }

        if let Some(country) = &self.country {
            parts.push(country.clone());
        }

        parts.join(", ")
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct Partner {
    pub name: Option<String>,
    pub first_name: Option<String>,
    pub last_name: Option<String>,
    pub birth_date: Option<NaiveDate>,
    pub role: Option<String>,
    pub representation: Option<String>,
}

impl Partner {
    pub fn format_name(&self) -> String {
        if let Some(name) = &self.name {
            name.clone()
        } else {
            let mut parts = Vec::new();
            if let Some(first) = &self.first_name {
                parts.push(first.clone());
            }
            if let Some(last) = &self.last_name {
                parts.push(last.clone());
            }
            if parts.is_empty() {
                "Unknown".to_string()
            } else {
                parts.join(" ")
            }
        }
    }
}

#[derive(Debug, Deserialize, Clone)]
pub struct RegistryEntry {
    #[serde(rename = "type")]
    pub entry_type: Option<String>,
    pub court: Option<String>,
    pub file_number: Option<String>,
    pub application_date: Option<NaiveDate>,
    pub registration_date: Option<NaiveDate>,
}

// ============================================================================
// Search Models
// ============================================================================

#[derive(Debug, Deserialize, Clone)]
pub struct SearchResponse {
    pub companies: Vec<CompanySummary>,
    pub total: i32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CompanyDetailsResponse {
    pub company: Company,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SearchSuggestion {
    pub firmenbuchnummer: String,
    pub name: String,
}

#[derive(Debug, Deserialize, Clone)]
pub struct SearchSuggestionsResponse {
    pub suggestions: Vec<SearchSuggestion>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct City {
    pub city: String,
    pub count: i32,
}

#[derive(Debug, Deserialize, Clone)]
pub struct CitiesResponse {
    pub cities: Vec<City>,
}

// ============================================================================
// Metrics Models
// ============================================================================

#[derive(Debug, Deserialize, Clone)]
pub struct Metrics {
    pub total_companies: i64,
    pub total_addresses: i64,
    pub total_partners: i64,
    pub total_registry_entries: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct Recommendation {
    pub firmenbuchnummer: String,
    pub name: String,
    pub views: i64,
}

#[derive(Debug, Deserialize, Clone)]
pub struct RecommendationsResponse {
    pub recommendations: Vec<Recommendation>,
}

// ============================================================================
// Error Response Model
// ============================================================================

#[derive(Debug, Deserialize, Clone)]
pub struct ErrorResponse {
    pub detail: String,
}

// ============================================================================
// Risk Indicators
// ============================================================================

/// Risk indicator names and their display labels
pub const RISK_INDICATORS: &[(&str, &str)] = &[
    ("debt_to_equity_ratio", "Debt to Equity Ratio"),
    ("cash_ratio", "Cash Ratio"),
    ("debt_to_assets", "Debt to Assets"),
    ("equity_ratio", "Equity Ratio"),
    ("concentration_risk", "Concentration Risk"),
    ("deferred_income_reliance", "Deferred Income Reliance"),
    ("balance_sheet_volatility", "Balance Sheet Volatility"),
    ("irregular_fiscal_year", "Irregular Fiscal Year"),
    ("compliance_status", "Compliance Status"),
    ("growth_revenue", "Revenue Growth"),
    ("operational_result_profit", "Operational Profit"),
];

/// Get display name for risk indicator
pub fn get_risk_indicator_name(key: &str) -> &str {
    RISK_INDICATORS
        .iter()
        .find(|(k, _)| *k == key)
        .map(|(_, v)| *v)
        .unwrap_or(key)
}

// ============================================================================
// Helper Functions
// ============================================================================

impl Company {
    /// Get the number of partners
    pub fn partner_count(&self) -> usize {
        self.partners.len()
    }

    /// Get the number of registry entries
    pub fn registry_entry_count(&self) -> usize {
        self.registry_entries.len()
    }

    /// Check if company has risk indicators
    pub fn has_risk_data(&self) -> bool {
        self.risk_score.is_some() || !self.risk_indicators.is_empty()
    }

    /// Get risk level category (Low, Medium, High)
    pub fn risk_level(&self) -> &str {
        match self.risk_score {
            Some(score) if score >= 0.7 => "High",
            Some(score) if score >= 0.4 => "Medium",
            Some(_) => "Low",
            None => "N/A",
        }
    }
}

impl CompanySummary {
    /// Get risk level category (Low, Medium, High)
    pub fn risk_level(&self) -> &str {
        match self.risk_score {
            Some(score) if score >= 0.7 => "High",
            Some(score) if score >= 0.4 => "Medium",
            Some(_) => "Low",
            None => "N/A",
        }
    }
}
