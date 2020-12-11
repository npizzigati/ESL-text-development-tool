ENV['RACK_ENV'] = 'test'

require 'bundler/setup'
require 'minitest/autorun'
require 'rack/test'
require 'logger'
require 'capybara/minitest'

require_relative '../app'

class CapybaraTestCase < Minitest::Test
  include Capybara::DSL
  include Capybara::Minitest::Assertions
  # Capybara.default_driver = :apparition

  def teardown
    Capybara.reset_sessions!
    Capybara.use_default_driver
  end
end

class UnitAppTest < Minitest::Test
  include Rack::Test::Methods

  def app
    Sinatra::Application
  end

  def setup
  end

  def teardown
  end
end

class IntegrationAppTest < CapybaraTestCase
  Capybara.app = Sinatra::Application

  def setup
  end

  def teardown
  end
end
