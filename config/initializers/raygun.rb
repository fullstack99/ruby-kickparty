Raygun.setup do |config|
  config.api_key = "w3xG08HXlKQIY4I2YJ1OXA=="
  config.filter_parameters = Rails.application.config.filter_parameters

  # The default is Rails.env.production?
  # config.enable_reporting = !Rails.env.development? && !Rails.env.test?
end
