import { ModelConfig } from './index';

export const historicalConfig: ModelConfig = {
  id: 'historical',
  name: 'Historical Data Model',
  description: 'Financial modeling for established businesses with historical data',
  category: 'Established Business',
  icon: '📊',
  color: 'bg-purple-500',
  features: [
    'Historical financial data analysis',
    'Trend-based projections',
    'Working capital optimization',
    'Capital structure analysis',
    'Performance benchmarking'
  ],
  variables: [
    {
      id: 'basic_info',
      title: 'Basic Information',
      variables: [
        {
          id: 'businessType',
          name: 'Business Type',
          type: 'select',
          options: [
            { value: 'service', label: 'Service Business' },
            { value: 'retail', label: 'Retail Business' },
            { value: 'saas', label: 'SaaS Business' }
          ],
          defaultValue: 'service',
          description: 'Type of established business'
        },
        {
          id: 'historicalYears',
          name: 'Historical Years',
          type: 'number',
          min: 1,
          max: 10,
          defaultValue: 3,
          description: 'Number of years of historical data'
        },
        {
          id: 'forecastYears',
          name: 'Forecast Years',
          type: 'number',
          min: 1,
          max: 10,
          defaultValue: 5,
          description: 'Number of years to forecast'
        }
      ]
    },
    {
      id: 'projection_params',
      title: 'Projection Parameters',
      variables: [
        {
          id: 'revenueGrowth',
          name: 'Revenue Growth Rate (%)',
          type: 'number',
          step: 0.1,
          defaultValue: 10,
          description: 'Expected annual revenue growth rate'
        },
        {
          id: 'expenseGrowth',
          name: 'Expense Growth Rate (%)',
          type: 'number',
          step: 0.1,
          defaultValue: 5,
          description: 'Expected annual expense growth rate'
        },
        {
          id: 'marginImprovement',
          name: 'Margin Improvement (%)',
          type: 'number',
          step: 0.1,
          defaultValue: 2,
          description: 'Expected margin improvement over forecast period'
        }
      ]
    },
    {
      id: 'working_capital',
      title: 'Working Capital Parameters',
      variables: [
        {
          id: 'arDays',
          name: 'Accounts Receivable Days',
          type: 'number',
          defaultValue: 30,
          description: 'Average days to collect receivables'
        },
        {
          id: 'apDays',
          name: 'Accounts Payable Days',
          type: 'number',
          defaultValue: 30,
          description: 'Average days to pay suppliers'
        },
        {
          id: 'inventoryDays',
          name: 'Inventory Days',
          type: 'number',
          defaultValue: 60,
          description: 'Average inventory holding period'
        }
      ]
    },
    {
      id: 'capital_structure',
      title: 'Capital Structure',
      variables: [
        {
          id: 'targetDebtRatio',
          name: 'Target Debt Ratio (%)',
          type: 'number',
          step: 0.1,
          defaultValue: 30,
          description: 'Target debt-to-assets ratio'
        },
        {
          id: 'capexRatio',
          name: 'CapEx Ratio (% of Revenue)',
          type: 'number',
          step: 0.1,
          defaultValue: 5,
          description: 'Capital expenditure as percentage of revenue'
        },
        {
          id: 'taxRate',
          name: 'Tax Rate (%)',
          type: 'number',
          step: 0.1,
          defaultValue: 25,
          description: 'Effective corporate tax rate'
        }
      ]
    }
  ]
}; 