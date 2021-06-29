require 'bundler/setup'

require 'sinatra'
require 'tilt/erubis'
require 'json'
require 'sinatra/custom_logger'
require 'logger'
require 'puma'
require 'pg'

# Escape all html output
set :erb, escape_html: true

enable :logging
set :logger, Logger.new(STDOUT)

UPLOADS_DIRECTORY_NAME = 'data'.freeze

before do
  @db = if Sinatra::Base.production?
          PG.connect(ENV['DATABASE_URL'])
        else
          PG.connect(dbname: 'neilsidea')
        end
end

after do
  @db.close
end

get '/' do
  # :prepare_editor redirects to this page
  erb :main
end

post '/' do
  # Check if user uploaded a file
  return unless params[:file] && params[:file][:filename]

  record_in_stats('Posted headwords file')
  filename = params[:file][:filename]
  puts "upload file: #{filename}"
  target_path = File.join uploads_path, filename
  retrieve_upload(params, target_path)
  headwords_array = retrieve_headwords(target_path)
  unique_headwords = remove_duplicates(headwords_array)
  inflections_map = extract_inflections(unique_headwords)
  add_temporary_modifications!(inflections_map) # This is temporary... until I implement user modifications to inflections
  { 'headwords' => unique_headwords, 'inflections_map' => inflections_map }.to_json
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

def add_temporary_modifications!(inflections_map)
  temporary_inflections = { 'interesting' => 'interest', 'worker' => 'work', 'workers' => 'work' }
  temporary_inflections.each do |k, v|
    inflections_map[k] = v
  end
end

def extract_inflections(headwords)
  inflections_map = {}
  downcased_headwords = headwords.map(&:downcase)

  File.open('data/inflections.txt') do |f|
    f.each_line do |line|
      inflection, lemma, _pos = line.split(', ')
      inflections_map[inflection.downcase] = lemma if downcased_headwords.include?(lemma.downcase)
    end
  end

  inflections_map
end

def retrieve_headwords(target_path)
  raw_headword_text = retrieve_raw_headword_text(target_path)
  create_headwords_array(raw_headword_text)
end

def retrieve_raw_headword_text(target_path)
  File.read(target_path)
end

def remove_duplicates(headwords_array)
  unique_headwords = []
  headwords_array.each do |headword|
    unique_headwords << headword unless unique_headwords.include?(headword)
  end
  unique_headwords
end

def create_headwords_array(raw_headword_text)
  # Split words regardless of whether newline is CRLF or just LF
  raw_headword_text.gsub("\r\n", "\n").split("\n")
end

def record_in_stats(source_description)
  sql = <<~SQL
    INSERT INTO stats(source)
    VALUES
      ($1)
  SQL
  @db.exec_params(sql, [source_description])
end
