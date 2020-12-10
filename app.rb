require 'sinatra'
require 'sinatra/reloader' if development?
require 'tilt/erubis'
require 'json'
require 'sinatra/custom_logger'
require 'logger'
require 'puma'

set :logger, Logger.new(STDOUT)

get '/' do
  redirect :upload
end

get '/upload' do
  erb :upload
end

post '/upload' do
  # Check if user uploaded a file
  if params[:file] && params[:file][:filename]
    filename = params[:file][:filename]
    tempfile = params[:file][:tempfile]
    target_path = "public/uploads/#{filename}"

    File.open(target_path, 'wb') {|f| f.write tempfile.read }
  end

  inflections = extract_inflections(target_path).to_json
  erb :editor, locals: {inflections: inflections}
end

get '/editor' do
  erb :editor
end

def extract_inflections(target_path)
  logger.info 'in extract inflections method'
  raw_headword_text = File.read(target_path).downcase
  headwords = Set.new(raw_headword_text.split("\r\n"))
  lemmas = {}
  File.open('data/inflections.txt') do |f|
    logger.info 'inflections file opened'
    f.each_line do |line|
      inflection, lemma, _pos = line.split(', ')
      lemmas[inflection] = lemma if headwords.include?(lemma)
    end
  end

  lemmas
end
