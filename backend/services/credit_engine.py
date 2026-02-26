def calculate_owner_score(aadhaar_verified: bool, pan_linked: bool, blacklist_flag: bool, defaults_count: int, mismatch: bool = False) -> int:
    score = 700

    if aadhaar_verified:
        score += 100
    if pan_linked:
        score += 50
        
    if blacklist_flag:
        score -= 500
    if not pan_linked:
        score -= 200
    if mismatch:
        score -= 150
        
    score -= (defaults_count * 100)
    
    return max(0, min(1000, score))

def calculate_company_score(gst_active: bool, compliance_avg: int, company_age_years: int, is_suspended: bool) -> int:
    score = 600
    
    compliance_component = min(1000, compliance_avg * 10)
    age_bonus = min(200, company_age_years * 20)
    
    base_comp = (compliance_component * 0.7) + (age_bonus * 0.3)
    
    penalties = 0
    if is_suspended:
        penalties += 500
    if compliance_avg < 50:
        penalties += 150
        
    score = base_comp - penalties
    return int(max(0, min(1000, score)))

def calculate_transaction_score(total_invoices: int, paid_ratio: float, default_ratio: float, avg_delay_days: float) -> int:
    if total_invoices == 0:
        return 650
        
    score = 700
    
    if paid_ratio > 0.8:
        score += 100
    elif paid_ratio > 0.6:
        score += 50
        
    if default_ratio > 0.4:
        score -= 400
    elif default_ratio > 0.2:
        score -= 200
        
    if avg_delay_days > 60:
        score -= 200
    elif avg_delay_days > 30:
        score -= 100
    
    return max(0, min(1000, score))

def calculate_final_credit_score(owner_score: int, company_score: int, transaction_score: int) -> int:
    """ Computes the final credit score based on the weighted components
    Owner: 40%, Company: 40%, Transaction: 20%
    """
    final_score = (owner_score * 0.4) + (company_score * 0.4) + (transaction_score * 0.2)
    return int(final_score)
