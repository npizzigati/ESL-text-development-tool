require 'bundler/setup'

require 'sinatra'
require 'sinatra/reloader' if development?
require 'tilt/erubis'
require 'json'
require 'sinatra/custom_logger'
require 'logger'
require 'puma'

enable :logging
set :logger, Logger.new(STDOUT)

UPLOADS_DIRECTORY_NAME = 'data'.freeze

get '/' do
  redirect :upload
end

get '/upload' do
  erb :upload
end

post '/upload' do
  # Check if user uploaded a file
  return unless params[:file] && params[:file][:filename]

  filename = params[:file][:filename]
  target_path = File.join uploads_path, filename
  retrieve_upload(params, target_path)
  headwords_array = retrieve_headwords(target_path)
  headwords_set = remove_duplicates(headwords_array)
  @headwords_json = headwords_array.to_json
  @inflections_map_json = extract_inflections(headwords_set).to_json
  erb :editor
end

get '/editor' do
  erb :editor
end

def root_path
  File.expand_path(__dir__)
end

def uploads_path
  File.join root_path, UPLOADS_DIRECTORY_NAME
end

def retrieve_upload(params, target_path)
  logger.info "params[:file] #{params[:file]}"
  # Save file in target_path
  tempfile = params[:file][:tempfile]
  File.open(target_path, 'wb') { |f| f.write tempfile.read }
end

def extract_inflections(headwords)
  inflections_map = {}

  File.open('data/inflections.txt') do |f|
    f.each_line do |line|
      inflection, lemma, _pos = line.split(', ')
      inflections_map[inflection] = lemma if headwords.include?(lemma)
    end
  end

  inflections_map
end

def retrieve_headwords(target_path)
  raw_headword_text = retrieve_raw_headword_text(target_path)
  create_headwords_array(raw_headword_text)
end

# TODO: Need to find an intelligent way to deal with uppercase words, like days of the week, etc.
def retrieve_raw_headword_text(target_path)
  text = File.read(target_path).downcase
  text.gsub("\r\ni\r\n", "\r\nI\r\n")
end

def remove_duplicates(headwords_array)
  Set.new(headwords_array)
end

def create_headwords_array(raw_headword_text)
  raw_headword_text.split("\r\n")
end
