import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// Comprehensive case types for classification - Law Firm Specialization
const CASE_TYPES = [
  // EMPLOYMENT LAW
  "Wrongful Termination",
  "Employment Dispute", 
  "Workplace Discrimination",
  "Sexual Harassment",
  "Wage and Hour Dispute",
  "Unpaid Wages",
  "Overtime Pay Dispute",
  "Severance Negotiation",
  "Employment Contract Review",
  "Non-Compete Agreement",
  "Workplace Retaliation",
  "Family and Medical Leave Act",
  "Workers Compensation",
  "Disability Accommodation",
  "Union Dispute",
  "Labor Union Issues",

  // CONTRACT LAW
  "Contract Dispute",
  "Breach of Contract",
  "Contract Drafting",
  "Contract Review",
  "Service Agreement",
  "Purchase Agreement",
  "Sales Contract",
  "Consulting Agreement",
  "Non-Disclosure Agreement",
  "Non-Compete Violation",
  "Partnership Agreement",
  "Joint Venture Agreement",
  "Franchise Agreement",
  "Licensing Agreement",
  "Distribution Agreement",

  // CRIMINAL LAW
  "Assault",
  "Battery",
  "Domestic Violence",
  "Stalking",
  "Harassment",
  "Theft",
  "Shoplifting",
  "Larceny",
  "Burglary",
  "Robbery",
  "Vandalism",
  "Drug Offenses",
  "DUI/DWI",
  "Traffic Violations",
  "Weapons Charges",
  "Probation Violation",

  // WHITE COLLAR CRIME
  "Fraud",
  "Embezzlement",
  "Money Laundering",
  "Tax Evasion",
  "Insider Trading",
  "Securities Fraud",
  "Corporate Fraud",
  "Insurance Fraud",
  "Healthcare Fraud",
  "Mail Fraud",
  "Wire Fraud",
  "Identity Theft",
  "Credit Card Fraud",
  "Cybercrime",
  "Computer Fraud",

  // FAMILY LAW
  "Divorce",
  "Legal Separation",
  "Child Custody",
  "Child Support",
  "Alimony",
  "Spousal Support",
  "Prenuptial Agreement",
  "Postnuptial Agreement",
  "Adoption",
  "Guardianship",
  "Conservatorship",
  "Domestic Dispute",
  "Paternity",
  "Grandparent Rights",
  "Child Protection",

  // REAL ESTATE & PROPERTY LAW
  "Real Estate Dispute",
  "Property Dispute",
  "Land Dispute",
  "Boundary Dispute",
  "Title Dispute",
  "Easement Dispute",
  "Zoning Issue",
  "Landlord Dispute",
  "Tenant Rights",
  "Eviction",
  "Lease Agreement",
  "Property Damage",
  "Construction Dispute",
  "Homeowners Association",
  "Condominium Law",

  // PERSONAL INJURY
  "Personal Injury",
  "Car Accident",
  "Truck Accident",
  "Motorcycle Accident",
  "Slip and Fall",
  "Premises Liability",
  "Product Liability",
  "Medical Malpractice",
  "Wrongful Death",
  "Nursing Home Abuse",
  "Dog Bite",
  "Catastrophic Injury",
  "Brain Injury",
  "Spinal Cord Injury",
  "Burn Injury",

  // BUSINESS & CORPORATE LAW
  "Corporate Law",
  "Business Formation",
  "Business Dissolution",
  "Mergers and Acquisitions",
  "Shareholder Dispute",
  "Partnership Dispute",
  "Corporate Governance",
  "Board of Directors",
  "Corporate Compliance",
  "Business Contracts",
  "Commercial Litigation",
  "Business Torts",
  "Unfair Competition",
  "Trade Secret",
  "Business Valuation",

  // INTELLECTUAL PROPERTY
  "Trademark Infringement",
  "Copyright Infringement",
  "Patent Dispute",
  "Trade Secret Misappropriation",
  "Intellectual Property",
  "IP Licensing",
  "Domain Name Dispute",
  "Software Licensing",
  "Music Copyright",
  "Art Copyright",
  "Patent Application",
  "Trademark Registration",
  "Trade Dress",
  "Right of Publicity",

  // IMMIGRATION LAW
  "Immigration",
  "Visa Application",
  "Green Card",
  "Citizenship",
  "Naturalization",
  "Deportation Defense",
  "Asylum",
  "Refugee Status",
  "Work Visa",
  "Student Visa",
  "Family Visa",
  "Immigration Bond",
  "ICE Detention",
  "Immigration Appeal",
  "Sanctuary Cities",

  // ESTATE PLANNING & PROBATE
  "Estate Planning",
  "Will Drafting",
  "Will Contest",
  "Probate",
  "Estate Administration",
  "Trust Administration",
  "Living Trust",
  "Power of Attorney",
  "Healthcare Directive",
  "Inheritance Dispute",
  "Estate Tax",
  "Gift Tax",
  "Charitable Trust",
  "Special Needs Trust",
  "Estate Litigation",

  // BANKRUPTCY & DEBT
  "Bankruptcy",
  "Chapter 7 Bankruptcy",
  "Chapter 11 Bankruptcy",
  "Chapter 13 Bankruptcy",
  "Debt Collection",
  "Credit Card Debt",
  "Medical Debt",
  "Student Loan Debt",
  "Foreclosure Defense",
  "Loan Modification",
  "Debt Settlement",
  "Repossession",
  "Garnishment",
  "Judgment Enforcement",
  "Creditor Rights",

  // CIVIL RIGHTS & CONSTITUTIONAL LAW
  "Civil Rights",
  "Constitutional Law",
  "First Amendment",
  "Fourth Amendment",
  "Due Process",
  "Equal Protection",
  "Police Misconduct",
  "Excessive Force",
  "False Arrest",
  "Malicious Prosecution",
  "Voting Rights",
  "Religious Freedom",
  "Free Speech",
  "Assembly Rights",

  // ADMINISTRATIVE & REGULATORY LAW
  "Administrative Law",
  "Regulatory Compliance",
  "Government Contracts",
  "Public Procurement",
  "FOIA Request",
  "Professional Licensing",
  "Healthcare Regulation",
  "Environmental Compliance",
  "OSHA Compliance",
  "FDA Compliance",
  "SEC Compliance",
  "Tax Controversy",
  "Customs Law",
  "Import/Export",

  // ENVIRONMENTAL LAW
  "Environmental Law",
  "Pollution",
  "Toxic Tort",
  "Hazardous Waste",
  "Environmental Impact",
  "Water Rights",
  "Air Quality",
  "Endangered Species",
  "Coastal Zone",
  "Wetlands",
  "Environmental Permit",
  "Climate Change",
  "Renewable Energy",
  "Environmental Litigation",

  // CONSUMER PROTECTION
  "Consumer Protection",
  "Product Recall",
  "False Advertising",
  "Consumer Fraud",
  "Lemon Law",
  "Debt Collection Abuse",
  "Credit Report Error",
  "Identity Theft Protection",
  "Online Privacy",
  "Data Breach",
  "Consumer Warranty",
  "Service Contract",
  "Timeshare Dispute",
  "Pyramid Scheme",

  // HEALTHCARE LAW
  "Healthcare Law",
  "Medical Malpractice",
  "Healthcare Compliance",
  "HIPAA Violation",
  "Medicare Fraud",
  "Medicaid Fraud",
  "Hospital Law",
  "Pharmaceutical Law",
  "Medical Device",
  "Bioethics",
  "Patient Rights",
  "Healthcare Privacy",
  "Telemedicine",
  "Clinical Trials",

  // EDUCATION LAW
  "Education Law",
  "Special Education",
  "Student Rights",
  "Teacher Rights",
  "School Discipline",
  "Bullying",
  "Title IX",
  "Campus Safety",
  "Academic Freedom",
  "Student Loans",
  "Education Discrimination",
  "Charter Schools",
  "School Funding",

  // MILITARY LAW
  "Military Law",
  "Court Martial",
  "Military Justice",
  "Veterans Benefits",
  "Discharge Upgrade",
  "Military Divorce",
  "Service-Connected Disability",
  "GI Bill",
  "Military Contracts",
  "Defense Contractor",
  "National Security",
  "Classified Information",

  // ENTERTAINMENT & SPORTS LAW
  "Entertainment Law",
  "Sports Law",
  "Music Industry",
  "Film Production",
  "Publishing",
  "Athlete Contracts",
  "Endorsement Deals",
  "Intellectual Property",
  "Media Law",
  "Defamation",
  "Privacy Rights",
  "Right of Publicity",
  "Talent Contracts",

  // INTERNATIONAL LAW
  "International Law",
  "International Trade",
  "Import/Export",
  "International Arbitration",
  "Foreign Investment",
  "International Contracts",
  "Extradition",
  "Diplomatic Immunity",
  "International Human Rights",
  "Cross-Border Litigation",
  "International Tax",
  "Treaty Law",
  "World Trade Organization",

  // AGRICULTURAL LAW
  "Agricultural Law",
  "Farm Disputes",
  "Land Use",
  "Water Rights",
  "Crop Insurance",
  "Livestock",
  "Agricultural Contracts",
  "Farm Subsidies",
  "Rural Development",
  "Organic Farming",
  "Sustainable Agriculture",

  // AVIATION & MARITIME LAW
  "Aviation Law",
  "Maritime Law",
  "Admiralty Law",
  "Airline Disputes",
  "Aircraft Accidents",
  "Shipping Law",
  "Boating Accidents",
  "Cruise Ship Incidents",
  "Pilot Rights",
  "Airport Law",
  "Space Law",
  "Drone Regulations",

  // TECHNOLOGY & CYBER LAW
  "Technology Law",
  "Cybersecurity",
  "Data Privacy",
  "Internet Law",
  "E-Commerce",
  "Software Disputes",
  "Domain Names",
  "Social Media",
  "Online Defamation",
  "Digital Rights",
  "Blockchain",
  "Cryptocurrency",
  "Artificial Intelligence",

  // INSURANCE LAW
  "Insurance Law",
  "Insurance Claims",
  "Bad Faith",
  "Life Insurance",
  "Health Insurance",
  "Auto Insurance",
  "Homeowners Insurance",
  "Disability Insurance",
  "Annuities",
  "Reinsurance",
  "Insurance Regulation",
  "Risk Management",

  // TAX LAW
  "Tax Law",
  "Income Tax",
  "Corporate Tax",
  "Property Tax",
  "Sales Tax",
  "Estate Tax",
  "Gift Tax",
  "International Tax",
  "Tax Planning",
  "Tax Controversy",
  "IRS Audit",
  "Tax Evasion",
  "Tax Fraud",

  // UTILITIES & ENERGY LAW
  "Energy Law",
  "Utilities Law",
  "Electricity Regulation",
  "Natural Gas",
  "Oil and Gas",
  "Renewable Energy",
  "Nuclear Energy",
  "Pipeline Law",
  "Mining Law",
  "Water Rights",
  "Utility Rates",

  // NONPROFIT & RELIGIOUS LAW
  "Nonprofit Law",
  "Religious Law",
  "501(c)(3) Organization",
  "Charitable Organization",
  "Religious Institution",
  "Church Law",
  "Tax-Exempt Status",
  "Nonprofit Governance",
  "Foundation Law",
  "Endowment Management",

  // GOVERNMENT & PUBLIC POLICY
  "Government Law",
  "Public Policy",
  "Legislative Law",
  "Campaign Finance",
  "Election Law",
  "Ethics Law",
  "Lobbying",
  "Public Interest",
  "Administrative Appeal",
  "Judicial Review",
  "Constitutional Challenge",
];

// Map specific case types to general lawyer specializations
const SPECIALIZATION_MAP = {
  // EMPLOYMENT LAW
  "Wrongful Termination": ["Employment Law"],
  "Employment Dispute": ["Employment Law"],
  "Workplace Discrimination": ["Employment Law", "Civil Rights"],
  "Sexual Harassment": ["Employment Law", "Civil Rights"],
  "Wage and Hour Dispute": ["Employment Law"],
  "Unpaid Wages": ["Employment Law"],
  "Overtime Pay Dispute": ["Employment Law"],
  "Severance Negotiation": ["Employment Law", "Contract Law"],
  "Employment Contract Review": ["Employment Law", "Contract Law"],
  "Non-Compete Agreement": ["Employment Law", "Corporate Law"],
  "Workplace Retaliation": ["Employment Law", "Civil Rights"],
  "Family and Medical Leave Act": ["Employment Law"],
  "Workers Compensation": ["Workers Compensation", "Employment Law"],
  "Disability Accommodation": ["Employment Law", "Disability Law"],
  "Union Dispute": ["Employment Law", "Labor Law"],
  "Labor Union Issues": ["Employment Law", "Labor Law"],

  // CONTRACT LAW
  "Contract Dispute": ["Corporate Law", "Contract Law"],
  "Breach of Contract": ["Corporate Law", "Contract Law"],
  "Contract Drafting": ["Corporate Law", "Contract Law"],
  "Contract Review": ["Corporate Law", "Contract Law"],
  "Service Agreement": ["Corporate Law", "Contract Law"],
  "Purchase Agreement": ["Corporate Law", "Contract Law"],
  "Sales Contract": ["Corporate Law", "Contract Law"],
  "Consulting Agreement": ["Corporate Law", "Contract Law"],
  "Non-Disclosure Agreement": ["Corporate Law", "Intellectual Property"],
  "Non-Compete Violation": ["Corporate Law", "Employment Law"],
  "Partnership Agreement": ["Corporate Law", "Business Law"],
  "Joint Venture Agreement": ["Corporate Law", "Business Law"],
  "Franchise Agreement": ["Corporate Law", "Business Law"],
  "Licensing Agreement": ["Corporate Law", "Intellectual Property"],
  "Distribution Agreement": ["Corporate Law", "Business Law"],

  // CRIMINAL LAW
  "Assault": ["Criminal Law"],
  "Battery": ["Criminal Law"],
  "Domestic Violence": ["Criminal Law", "Family Law"],
  "Stalking": ["Criminal Law"],
  "Harassment": ["Criminal Law", "Civil Rights"],
  "Theft": ["Criminal Law"],
  "Shoplifting": ["Criminal Law"],
  "Larceny": ["Criminal Law"],
  "Burglary": ["Criminal Law"],
  "Robbery": ["Criminal Law"],
  "Vandalism": ["Criminal Law"],
  "Drug Offenses": ["Criminal Law"],
  "DUI/DWI": ["Criminal Law"],
  "Traffic Violations": ["Criminal Law"],
  "Weapons Charges": ["Criminal Law"],
  "Probation Violation": ["Criminal Law"],

  // WHITE COLLAR CRIME
  "Fraud": ["Criminal Law", "Corporate Law"],
  "Embezzlement": ["Criminal Law", "Corporate Law"],
  "Money Laundering": ["Criminal Law", "Corporate Law"],
  "Tax Evasion": ["Criminal Law", "Tax Law"],
  "Insider Trading": ["Criminal Law", "Corporate Law", "Securities Law"],
  "Securities Fraud": ["Criminal Law", "Securities Law"],
  "Corporate Fraud": ["Criminal Law", "Corporate Law"],
  "Insurance Fraud": ["Criminal Law", "Insurance Law"],
  "Healthcare Fraud": ["Criminal Law", "Healthcare Law"],
  "Mail Fraud": ["Criminal Law"],
  "Wire Fraud": ["Criminal Law"],
  "Identity Theft": ["Criminal Law", "Technology Law"],
  "Credit Card Fraud": ["Criminal Law"],
  "Cybercrime": ["Criminal Law", "Technology Law"],
  "Computer Fraud": ["Criminal Law", "Technology Law"],

  // FAMILY LAW
  "Divorce": ["Family Law"],
  "Legal Separation": ["Family Law"],
  "Child Custody": ["Family Law"],
  "Child Support": ["Family Law"],
  "Alimony": ["Family Law"],
  "Spousal Support": ["Family Law"],
  "Prenuptial Agreement": ["Family Law", "Contract Law"],
  "Postnuptial Agreement": ["Family Law", "Contract Law"],
  "Adoption": ["Family Law"],
  "Guardianship": ["Family Law"],
  "Conservatorship": ["Family Law", "Estate Planning"],
  "Domestic Dispute": ["Family Law"],
  "Paternity": ["Family Law"],
  "Grandparent Rights": ["Family Law"],
  "Child Protection": ["Family Law"],

  // REAL ESTATE & PROPERTY LAW
  "Real Estate Dispute": ["Real Estate Law", "Property Law"],
  "Property Dispute": ["Property Law", "Real Estate Law"],
  "Land Dispute": ["Property Law", "Real Estate Law"],
  "Boundary Dispute": ["Property Law"],
  "Title Dispute": ["Property Law", "Real Estate Law"],
  "Easement Dispute": ["Property Law", "Real Estate Law"],
  "Zoning Issue": ["Property Law", "Administrative Law"],
  "Landlord Dispute": ["Property Law", "Real Estate Law"],
  "Tenant Rights": ["Property Law", "Real Estate Law"],
  "Eviction": ["Property Law", "Real Estate Law"],
  "Lease Agreement": ["Property Law", "Real Estate Law"],
  "Property Damage": ["Property Law", "Personal Injury"],
  "Construction Dispute": ["Construction Law", "Property Law"],
  "Homeowners Association": ["Property Law", "Real Estate Law"],
  "Condominium Law": ["Property Law", "Real Estate Law"],

  // PERSONAL INJURY
  "Personal Injury": ["Personal Injury"],
  "Car Accident": ["Personal Injury"],
  "Truck Accident": ["Personal Injury"],
  "Motorcycle Accident": ["Personal Injury"],
  "Slip and Fall": ["Personal Injury"],
  "Premises Liability": ["Personal Injury", "Property Law"],
  "Product Liability": ["Personal Injury", "Product Liability"],
  "Medical Malpractice": ["Medical Malpractice", "Personal Injury"],
  "Wrongful Death": ["Personal Injury"],
  "Nursing Home Abuse": ["Personal Injury", "Elder Law"],
  "Dog Bite": ["Personal Injury"],
  "Catastrophic Injury": ["Personal Injury"],
  "Brain Injury": ["Personal Injury"],
  "Spinal Cord Injury": ["Personal Injury"],
  "Burn Injury": ["Personal Injury"],

  // BUSINESS & CORPORATE LAW
  "Corporate Law": ["Corporate Law"],
  "Business Formation": ["Corporate Law", "Business Law"],
  "Business Dissolution": ["Corporate Law", "Business Law"],
  "Mergers and Acquisitions": ["Corporate Law", "Business Law"],
  "Shareholder Dispute": ["Corporate Law", "Business Law"],
  "Partnership Dispute": ["Corporate Law", "Business Law"],
  "Corporate Governance": ["Corporate Law"],
  "Board of Directors": ["Corporate Law"],
  "Corporate Compliance": ["Corporate Law", "Administrative Law"],
  "Business Contracts": ["Corporate Law", "Contract Law"],
  "Commercial Litigation": ["Corporate Law", "Business Law"],
  "Business Torts": ["Corporate Law", "Business Law"],
  "Unfair Competition": ["Corporate Law", "Business Law"],
  "Trade Secret": ["Corporate Law", "Intellectual Property"],
  "Business Valuation": ["Corporate Law", "Business Law"],

  // INTELLECTUAL PROPERTY
  "Trademark Infringement": ["Intellectual Property"],
  "Copyright Infringement": ["Intellectual Property"],
  "Patent Dispute": ["Intellectual Property"],
  "Trade Secret Misappropriation": ["Intellectual Property", "Corporate Law"],
  "Intellectual Property": ["Intellectual Property"],
  "IP Licensing": ["Intellectual Property", "Corporate Law"],
  "Domain Name Dispute": ["Intellectual Property", "Technology Law"],
  "Software Licensing": ["Intellectual Property", "Technology Law"],
  "Music Copyright": ["Intellectual Property", "Entertainment Law"],
  "Art Copyright": ["Intellectual Property", "Entertainment Law"],
  "Patent Application": ["Intellectual Property"],
  "Trademark Registration": ["Intellectual Property"],
  "Trade Dress": ["Intellectual Property"],
  "Right of Publicity": ["Intellectual Property", "Entertainment Law"],

  // IMMIGRATION LAW
  "Immigration": ["Immigration Law"],
  "Visa Application": ["Immigration Law"],
  "Green Card": ["Immigration Law"],
  "Citizenship": ["Immigration Law"],
  "Naturalization": ["Immigration Law"],
  "Deportation Defense": ["Immigration Law"],
  "Asylum": ["Immigration Law"],
  "Refugee Status": ["Immigration Law"],
  "Work Visa": ["Immigration Law"],
  "Student Visa": ["Immigration Law"],
  "Family Visa": ["Immigration Law"],
  "Immigration Bond": ["Immigration Law"],
  "ICE Detention": ["Immigration Law"],
  "Immigration Appeal": ["Immigration Law"],
  "Sanctuary Cities": ["Immigration Law"],

  // ESTATE PLANNING & PROBATE
  "Estate Planning": ["Estate Planning"],
  "Will Drafting": ["Estate Planning"],
  "Will Contest": ["Estate Planning", "Family Law"],
  "Probate": ["Estate Planning"],
  "Estate Administration": ["Estate Planning"],
  "Trust Administration": ["Estate Planning"],
  "Living Trust": ["Estate Planning"],
  "Power of Attorney": ["Estate Planning"],
  "Healthcare Directive": ["Estate Planning", "Healthcare Law"],
  "Inheritance Dispute": ["Estate Planning", "Family Law"],
  "Estate Tax": ["Estate Planning", "Tax Law"],
  "Gift Tax": ["Estate Planning", "Tax Law"],
  "Charitable Trust": ["Estate Planning", "Nonprofit Law"],
  "Special Needs Trust": ["Estate Planning", "Disability Law"],
  "Estate Litigation": ["Estate Planning"],

  // BANKRUPTCY & DEBT
  "Bankruptcy": ["Bankruptcy Law"],
  "Chapter 7 Bankruptcy": ["Bankruptcy Law"],
  "Chapter 11 Bankruptcy": ["Bankruptcy Law", "Corporate Law"],
  "Chapter 13 Bankruptcy": ["Bankruptcy Law"],
  "Debt Collection": ["Debt Collection"],
  "Credit Card Debt": ["Debt Collection", "Consumer Protection"],
  "Medical Debt": ["Debt Collection", "Healthcare Law"],
  "Student Loan Debt": ["Debt Collection", "Education Law"],
  "Foreclosure Defense": ["Bankruptcy Law", "Real Estate Law"],
  "Loan Modification": ["Bankruptcy Law", "Real Estate Law"],
  "Debt Settlement": ["Debt Collection"],
  "Repossession": ["Debt Collection", "Consumer Protection"],
  "Garnishment": ["Debt Collection"],
  "Judgment Enforcement": ["Debt Collection"],
  "Creditor Rights": ["Debt Collection"],

  // CIVIL RIGHTS & CONSTITUTIONAL LAW
  "Civil Rights": ["Civil Rights"],
  "Constitutional Law": ["Constitutional Law"],
  "First Amendment": ["Constitutional Law", "Civil Rights"],
  "Fourth Amendment": ["Constitutional Law", "Civil Rights"],
  "Due Process": ["Constitutional Law", "Civil Rights"],
  "Equal Protection": ["Constitutional Law", "Civil Rights"],
  "Police Misconduct": ["Civil Rights", "Criminal Law"],
  "Excessive Force": ["Civil Rights", "Criminal Law"],
  "False Arrest": ["Civil Rights", "Criminal Law"],
  "Malicious Prosecution": ["Civil Rights", "Criminal Law"],
  "Voting Rights": ["Civil Rights", "Constitutional Law"],
  "Religious Freedom": ["Civil Rights", "Constitutional Law"],
  "Free Speech": ["Civil Rights", "Constitutional Law"],
  "Assembly Rights": ["Civil Rights", "Constitutional Law"],

  // ADMINISTRATIVE & REGULATORY LAW
  "Administrative Law": ["Administrative Law"],
  "Regulatory Compliance": ["Administrative Law", "Corporate Law"],
  "Government Contracts": ["Government Contracts", "Administrative Law"],
  "Public Procurement": ["Government Contracts", "Administrative Law"],
  "FOIA Request": ["Administrative Law"],
  "Professional Licensing": ["Administrative Law"],
  "Healthcare Regulation": ["Administrative Law", "Healthcare Law"],
  "Environmental Compliance": ["Administrative Law", "Environmental Law"],
  "OSHA Compliance": ["Administrative Law", "Employment Law"],
  "FDA Compliance": ["Administrative Law", "Healthcare Law"],
  "SEC Compliance": ["Administrative Law", "Securities Law"],
  "Tax Controversy": ["Administrative Law", "Tax Law"],
  "Customs Law": ["Administrative Law", "International Law"],
  "Import/Export": ["Administrative Law", "International Law"],

  // ENVIRONMENTAL LAW
  "Environmental Law": ["Environmental Law"],
  "Pollution": ["Environmental Law", "Personal Injury"],
  "Toxic Tort": ["Environmental Law", "Personal Injury"],
  "Hazardous Waste": ["Environmental Law", "Administrative Law"],
  "Environmental Impact": ["Environmental Law", "Administrative Law"],
  "Water Rights": ["Environmental Law", "Property Law"],
  "Air Quality": ["Environmental Law", "Administrative Law"],
  "Endangered Species": ["Environmental Law", "Administrative Law"],
  "Coastal Zone": ["Environmental Law", "Property Law"],
  "Wetlands": ["Environmental Law", "Property Law"],
  "Environmental Permit": ["Environmental Law", "Administrative Law"],
  "Climate Change": ["Environmental Law", "Administrative Law"],
  "Renewable Energy": ["Environmental Law", "Energy Law"],
  "Environmental Litigation": ["Environmental Law"],

  // CONSUMER PROTECTION
  "Consumer Protection": ["Consumer Protection"],
  "Product Recall": ["Consumer Protection", "Product Liability"],
  "False Advertising": ["Consumer Protection", "Business Law"],
  "Consumer Fraud": ["Consumer Protection", "Criminal Law"],
  "Lemon Law": ["Consumer Protection", "Product Liability"],
  "Debt Collection Abuse": ["Consumer Protection", "Debt Collection"],
  "Credit Report Error": ["Consumer Protection"],
  "Identity Theft Protection": ["Consumer Protection", "Technology Law"],
  "Online Privacy": ["Consumer Protection", "Technology Law"],
  "Data Breach": ["Consumer Protection", "Technology Law"],
  "Consumer Warranty": ["Consumer Protection", "Product Liability"],
  "Service Contract": ["Consumer Protection", "Contract Law"],
  "Timeshare Dispute": ["Consumer Protection", "Real Estate Law"],
  "Pyramid Scheme": ["Consumer Protection", "Criminal Law"],

  // HEALTHCARE LAW
  "Healthcare Law": ["Healthcare Law"],
  "Medical Malpractice": ["Medical Malpractice", "Healthcare Law"],
  "Healthcare Compliance": ["Healthcare Law", "Administrative Law"],
  "HIPAA Violation": ["Healthcare Law", "Technology Law"],
  "Medicare Fraud": ["Healthcare Law", "Criminal Law"],
  "Medicaid Fraud": ["Healthcare Law", "Criminal Law"],
  "Hospital Law": ["Healthcare Law", "Corporate Law"],
  "Pharmaceutical Law": ["Healthcare Law", "Corporate Law"],
  "Medical Device": ["Healthcare Law", "Product Liability"],
  "Bioethics": ["Healthcare Law"],
  "Patient Rights": ["Healthcare Law", "Civil Rights"],
  "Healthcare Privacy": ["Healthcare Law", "Technology Law"],
  "Telemedicine": ["Healthcare Law", "Technology Law"],
  "Clinical Trials": ["Healthcare Law", "Administrative Law"],

  // EDUCATION LAW
  "Education Law": ["Education Law"],
  "Special Education": ["Education Law", "Civil Rights"],
  "Student Rights": ["Education Law", "Civil Rights"],
  "Teacher Rights": ["Education Law", "Employment Law"],
  "School Discipline": ["Education Law", "Civil Rights"],
  "Bullying": ["Education Law", "Civil Rights"],
  "Title IX": ["Education Law", "Civil Rights"],
  "Campus Safety": ["Education Law", "Personal Injury"],
  "Academic Freedom": ["Education Law", "Constitutional Law"],
  "Student Loans": ["Education Law", "Debt Collection"],
  "Education Discrimination": ["Education Law", "Civil Rights"],
  "Charter Schools": ["Education Law", "Administrative Law"],
  "School Funding": ["Education Law", "Administrative Law"],

  // MILITARY LAW
  "Military Law": ["Military Law"],
  "Court Martial": ["Military Law", "Criminal Law"],
  "Military Justice": ["Military Law"],
  "Veterans Benefits": ["Military Law", "Administrative Law"],
  "Discharge Upgrade": ["Military Law", "Administrative Law"],
  "Military Divorce": ["Military Law", "Family Law"],
  "Service-Connected Disability": ["Military Law", "Disability Law"],
  "GI Bill": ["Military Law", "Education Law"],
  "Military Contracts": ["Military Law", "Government Contracts"],
  "Defense Contractor": ["Military Law", "Corporate Law"],
  "National Security": ["Military Law", "Constitutional Law"],
  "Classified Information": ["Military Law", "Criminal Law"],

  // ENTERTAINMENT & SPORTS LAW
  "Entertainment Law": ["Entertainment Law"],
  "Sports Law": ["Sports Law"],
  "Music Industry": ["Entertainment Law", "Intellectual Property"],
  "Film Production": ["Entertainment Law", "Intellectual Property"],
  "Publishing": ["Entertainment Law", "Intellectual Property"],
  "Athlete Contracts": ["Sports Law", "Contract Law"],
  "Endorsement Deals": ["Sports Law", "Entertainment Law"],
  "Intellectual Property": ["Intellectual Property"],
  "Media Law": ["Entertainment Law", "Civil Rights"],
  "Defamation": ["Entertainment Law", "Civil Rights"],
  "Privacy Rights": ["Entertainment Law", "Civil Rights"],
  "Right of Publicity": ["Entertainment Law", "Intellectual Property"],
  "Talent Contracts": ["Entertainment Law", "Contract Law"],

  // INTERNATIONAL LAW
  "International Law": ["International Law"],
  "International Trade": ["International Law", "Business Law"],
  "Import/Export": ["International Law", "Administrative Law"],
  "International Arbitration": ["International Law"],
  "Foreign Investment": ["International Law", "Corporate Law"],
  "International Contracts": ["International Law", "Contract Law"],
  "Extradition": ["International Law", "Criminal Law"],
  "Diplomatic Immunity": ["International Law", "Constitutional Law"],
  "International Human Rights": ["International Law", "Civil Rights"],
  "Cross-Border Litigation": ["International Law"],
  "International Tax": ["International Law", "Tax Law"],
  "Treaty Law": ["International Law", "Constitutional Law"],
  "World Trade Organization": ["International Law", "Administrative Law"],

  // AGRICULTURAL LAW
  "Agricultural Law": ["Agricultural Law"],
  "Farm Disputes": ["Agricultural Law", "Property Law"],
  "Land Use": ["Agricultural Law", "Property Law"],
  "Water Rights": ["Agricultural Law", "Property Law"],
  "Crop Insurance": ["Agricultural Law", "Insurance Law"],
  "Livestock": ["Agricultural Law"],
  "Agricultural Contracts": ["Agricultural Law", "Contract Law"],
  "Farm Subsidies": ["Agricultural Law", "Administrative Law"],
  "Rural Development": ["Agricultural Law", "Administrative Law"],
  "Organic Farming": ["Agricultural Law", "Administrative Law"],
  "Sustainable Agriculture": ["Agricultural Law", "Environmental Law"],

  // AVIATION & MARITIME LAW
  "Aviation Law": ["Aviation Law"],
  "Maritime Law": ["Maritime Law"],
  "Admiralty Law": ["Maritime Law"],
  "Airline Disputes": ["Aviation Law", "Consumer Protection"],
  "Aircraft Accidents": ["Aviation Law", "Personal Injury"],
  "Shipping Law": ["Maritime Law", "International Law"],
  "Boating Accidents": ["Maritime Law", "Personal Injury"],
  "Cruise Ship Incidents": ["Maritime Law", "Personal Injury"],
  "Pilot Rights": ["Aviation Law", "Employment Law"],
  "Airport Law": ["Aviation Law", "Property Law"],
  "Space Law": ["Aviation Law", "International Law"],
  "Drone Regulations": ["Aviation Law", "Technology Law"],

  // TECHNOLOGY & CYBER LAW
  "Technology Law": ["Technology Law"],
  "Cybersecurity": ["Technology Law", "Criminal Law"],
  "Data Privacy": ["Technology Law", "Civil Rights"],
  "Internet Law": ["Technology Law"],
  "E-Commerce": ["Technology Law", "Business Law"],
  "Software Disputes": ["Technology Law", "Intellectual Property"],
  "Domain Names": ["Technology Law", "Intellectual Property"],
  "Social Media": ["Technology Law", "Civil Rights"],
  "Online Defamation": ["Technology Law", "Civil Rights"],
  "Digital Rights": ["Technology Law", "Civil Rights"],
  "Blockchain": ["Technology Law", "Business Law"],
  "Cryptocurrency": ["Technology Law", "Business Law"],
  "Artificial Intelligence": ["Technology Law", "Business Law"],

  // INSURANCE LAW
  "Insurance Law": ["Insurance Law"],
  "Insurance Claims": ["Insurance Law", "Consumer Protection"],
  "Bad Faith": ["Insurance Law", "Consumer Protection"],
  "Life Insurance": ["Insurance Law", "Estate Planning"],
  "Health Insurance": ["Insurance Law", "Healthcare Law"],
  "Auto Insurance": ["Insurance Law", "Personal Injury"],
  "Homeowners Insurance": ["Insurance Law", "Property Law"],
  "Disability Insurance": ["Insurance Law", "Disability Law"],
  "Annuities": ["Insurance Law", "Estate Planning"],
  "Reinsurance": ["Insurance Law", "Corporate Law"],
  "Insurance Regulation": ["Insurance Law", "Administrative Law"],
  "Risk Management": ["Insurance Law", "Business Law"],

  // TAX LAW
  "Tax Law": ["Tax Law"],
  "Income Tax": ["Tax Law"],
  "Corporate Tax": ["Tax Law", "Corporate Law"],
  "Property Tax": ["Tax Law", "Property Law"],
  "Sales Tax": ["Tax Law", "Business Law"],
  "Estate Tax": ["Tax Law", "Estate Planning"],
  "Gift Tax": ["Tax Law", "Estate Planning"],
  "International Tax": ["Tax Law", "International Law"],
  "Tax Planning": ["Tax Law"],
  "Tax Controversy": ["Tax Law", "Administrative Law"],
  "IRS Audit": ["Tax Law", "Administrative Law"],
  "Tax Evasion": ["Tax Law", "Criminal Law"],
  "Tax Fraud": ["Tax Law", "Criminal Law"],

  // UTILITIES & ENERGY LAW
  "Energy Law": ["Energy Law"],
  "Utilities Law": ["Utilities Law", "Administrative Law"],
  "Electricity Regulation": ["Energy Law", "Administrative Law"],
  "Natural Gas": ["Energy Law", "Administrative Law"],
  "Oil and Gas": ["Energy Law", "Property Law"],
  "Renewable Energy": ["Energy Law", "Environmental Law"],
  "Nuclear Energy": ["Energy Law", "Administrative Law"],
  "Pipeline Law": ["Energy Law", "Property Law"],
  "Mining Law": ["Energy Law", "Property Law"],
  "Water Rights": ["Energy Law", "Property Law"],
  "Utility Rates": ["Utilities Law", "Administrative Law"],

  // NONPROFIT & RELIGIOUS LAW
  "Nonprofit Law": ["Nonprofit Law"],
  "Religious Law": ["Religious Law", "Civil Rights"],
  "501(c)(3) Organization": ["Nonprofit Law", "Tax Law"],
  "Charitable Organization": ["Nonprofit Law", "Tax Law"],
  "Religious Institution": ["Religious Law", "Nonprofit Law"],
  "Church Law": ["Religious Law", "Nonprofit Law"],
  "Tax-Exempt Status": ["Nonprofit Law", "Tax Law"],
  "Nonprofit Governance": ["Nonprofit Law", "Corporate Law"],
  "Foundation Law": ["Nonprofit Law", "Estate Planning"],
  "Endowment Management": ["Nonprofit Law", "Estate Planning"],

  // GOVERNMENT & PUBLIC POLICY
  "Government Law": ["Government Law", "Administrative Law"],
  "Public Policy": ["Government Law", "Administrative Law"],
  "Legislative Law": ["Government Law", "Constitutional Law"],
  "Campaign Finance": ["Government Law", "Constitutional Law"],
  "Election Law": ["Government Law", "Constitutional Law"],
  "Ethics Law": ["Government Law", "Administrative Law"],
  "Lobbying": ["Government Law", "Administrative Law"],
  "Public Interest": ["Government Law", "Civil Rights"],
  "Administrative Appeal": ["Government Law", "Administrative Law"],
  "Judicial Review": ["Government Law", "Constitutional Law"],
  "Constitutional Challenge": ["Government Law", "Constitutional Law"],
};

// Load lawyers from Supabase database
async function loadLawyersFromSupabase() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.from("lawyers").select("*");

    if (error) {
      console.error("Supabase lawyers fetch error:", error);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn("No lawyers found in Supabase database");
      return [];
    }

    // Transform Supabase data to match expected format
    return data.map((l) => ({
      lawyer_id: l.id,
      lawyer_name: l.name,
      specializations: (l.specialization || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean),
      case_types: (l.specialization || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean), // Use specialization as case_types
      years_experience:
        l.experience === "0-2 years"
          ? 1
          : l.experience === "2-5 years"
            ? 3.5
            : l.experience === "5-10 years"
              ? 7.5
              : l.experience === "10+ years"
                ? 15
                : 0,
      past_case_count: 0, // Not available in current schema
      average_case_duration_months: 0, // Not available in current schema
      success_rate: 0.85, // Default assumption
      complex_case_ratio: 0.2, // Default assumption
      availability_score:
        l.availability === "Available"
          ? 0.9
          : l.availability === "Busy"
            ? 0.5
            : 0.1,
      case_history_summary: l.case_history_summary || "",
      email: l.email || "",
      phone: l.phone || "",
      barNumber: l.barNumber || "",
    }));
  } catch (e) {
    console.error("Failed to load lawyers from Supabase:", e);
    return [];
  }
}

async function classifyCaseWithHF(text, allCategories) {
  const apiKey = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_KEY;
  const model = process.env.HF_MODEL_ID || "MoritzLaurer/deberta-v3-large-zeroshot-v2.0";

  if (!apiKey || !allCategories || allCategories.length === 0) {
    return null;
  }

  try {
    const response = await fetch(
      `https://router.huggingface.co/hf-inference/models/${model}`,
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        method: "POST",
        body: JSON.stringify({
          inputs: text,
          parameters: {
            candidate_labels: allCategories.slice(0, 20), // Increased to get more categories
          },
        }),
        signal: AbortSignal.timeout(60000), // 60 second timeout
      },
    );

    if (!response.ok) {
      if (response.status === 504) {
        throw new Error(`HF API timeout - server took too long to respond`);
      } else if (response.status === 429) {
        throw new Error(`HF API rate limit exceeded`);
      } else {
        throw new Error(
          `HF API error ${response.status}: ${response.statusText}`,
        );
      }
    }

    const result = await response.json();

    // Handle direct array format (what BART actually returns)
    if (Array.isArray(result) && result.length > 0) {
      const firstItem = result[0];

      // Check if it's the simple format: [{label, score}, ...]
      if (firstItem.label && typeof firstItem.score === "number") {
        return result;
      }

      // Check if it's the complex format: [{labels: [...], scores: [...]}]
      if (firstItem.labels && firstItem.scores) {
        const mapped = firstItem.labels.map((label, index) => ({
          label: label,
          score: firstItem.scores[index] || 0,
        }));
        return mapped;
      }
    }

    // Handle direct object format
    if (result.labels && result.scores) {
      const mapped = result.labels.map((label, index) => ({
        label: label,
        score: result.scores[index] || 0,
      }));
      return mapped;
    }

    return null;
  } catch (e) {
    console.warn("HF classification failed:", e.message);
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const title = body?.case?.title ?? "";
    const description = body?.case?.description ?? "";

    if (!title && !description) {
      return NextResponse.json(
        { error: "Provide case.title or case.description" },
        { status: 400 },
      );
    }

    const text = [title, description].filter(Boolean).join(". ");
    const excludedLawyerIds = Array.isArray(body?.excludedLawyerIds)
      ? body.excludedLawyerIds
      : [];

    // Use comprehensive case types for HF classification
    let predictions = await classifyCaseWithHF(text, CASE_TYPES);
    console.log(
      "DEBUG - HF predictions:",
      predictions ? predictions.length : "null",
    );

    if (!predictions || predictions.length === 0) {
      return NextResponse.json(
        { error: "HF API classification failed - no results returned" },
        { status: 502 },
      );
    }

    // Load lawyers from Supabase
    let lawyers = await loadLawyersFromSupabase();
    console.log("DEBUG - Lawyers loaded:", lawyers.length);

    if (excludedLawyerIds.length > 0) {
      lawyers = lawyers.filter((l) => !excludedLawyerIds.includes(l.lawyer_id));
    }

    // Map predicted case types to lawyer specializations
    const topPredictions = predictions.slice(0, 5);
    const mappedSpecializations = topPredictions.flatMap(
      (p) => SPECIALIZATION_MAP[p.label] || [],
    );
    const uniqueSpecializations = [...new Set(mappedSpecializations)];

    console.log(
      "DEBUG - Top predictions:",
      topPredictions.map((p) => ({ label: p.label, score: p.score })),
    );
    console.log("DEBUG - Mapped specializations:", uniqueSpecializations);

    // Score lawyers: prefer matches to predicted specializations weighted by prediction confidence
    const scored = lawyers.map((l) => {
      const lawyerSpecializations = l.specializations || [];

      // Build a match score by summing the prediction confidence for any prediction
      // whose mapped specializations intersect the lawyer's specializations.
      // If a lawyer matches multiple mapped specializations for a single prediction,
      // give a small bonus for breadth.
      let matchScore = 0;
      topPredictions.forEach((p) => {
        const mappedSpecs = SPECIALIZATION_MAP[p.label] || [];
        const intersect = mappedSpecs.filter((s) =>
          lawyerSpecializations.includes(s),
        );
        if (intersect.length > 0) {
          // base contribution is the prediction confidence
          // more matched specializations -> small multiplier
          const multiBoost = 1 + 0.25 * (intersect.length - 1);
          matchScore += p.score * multiBoost;
        }
      });

      // Normalize matchScore to be in a reasonable range (cap to 1.5 to avoid domination)
      matchScore = Math.min(matchScore, 1.5);

      // Performance heuristic (kept similar to previous logic)
      const perf =
        0.5 * (l.success_rate || 0) +
        0.2 * (1 - (l.complex_case_ratio || 0)) +
        0.2 * (l.availability_score || 0) +
        0.1 * Math.min(1, (l.years_experience || 0) / 30);

      // Increase weight on matchScore so specializations dominate ranking
      const total = 0.75 * (matchScore / 1.5) + 0.25 * perf;

      return {
        lawyer_id: l.lawyer_id,
        lawyer_name: l.lawyer_name,
        case_types: l.case_types,
        specializations: l.specializations,
        success_rate: l.success_rate,
        availability_score: l.availability_score,
        years_experience: l.years_experience,
        case_history_summary: l.case_history_summary,
        email: l.email,
        phone: l.phone,
        barNumber: l.barNumber,
        matchScore,
        total,
      };
    });
    scored.sort((a, b) => b.total - a.total);
    const topLawyers = scored.slice(0, 5);

    return NextResponse.json({ predictions, topLawyers }, { status: 200 });
  } catch (err) {
    console.error("/api/dev/test-classify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
