#! /usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'grit'
require 'docugit/document'

class Docugit
  attr_reader :project_directory, :wiki_directory, :repo, :files, :current_file_name, :markdown_filenames
  
  def self.setup(wiki_directory)
    File.open("#{Dir.pwd}/.docugit-config", "w+") {|f| f.write(wiki_directory) }
  end
  
  def initialize(args)
    @project_directory = Dir.pwd
    @wiki_directory = get_wiki_directory
    @repo = Grit::Repo.new(@project_directory)
    @files = committed_files
    @markdown_filenames = []
  end
  
  def committed_files
    commit = @repo.head.commit
    filenames = []
    commit.diffs.each do |diff|
      filenames << diff.a_path
    end
    filenames
  end
  
  def to_markdown
    puts "Documenting..."
    @files.each do |commit_file|
      File.open(commit_file) do |file|
        @current_file_name = commit_file.split('/').last
        puts "Reading #{commit_file}"
        document = Document.start(file, @current_file_name, @wiki_directory)
        @markdown_filenames << (@current_file_name + ".md")
      end
    end
    puts "\n"
    puts "Added documentation to #{@wiki_directory} and commited #{@markdown_filenames.size} file(s)."
  end
  
  def commit_to_wiki
    Dir.chdir(@wiki_directory) do
      wiki_repo = Grit::Repo.new(@wiki_directory)
      wiki_repo.add(@markdown_filenames)
      wiki_repo.commit_index('Automated documentation with Docugit!')
    end
  end
  
  private
  
  def get_wiki_directory
    begin
      File.open("#{@project_directory}/.docugit-config", "r") {|f| f.read }
    rescue Errno::ENOENT => e
      puts "A Git repository directory has not been configured. Run 'docugit init <directory>' to initialize Docugit."
      exit
    end
  end
  
end

if ARGV.empty?
  docugit = Docugit.new(ARGV)
  docugit.to_markdown
  docugit.commit_to_wiki
elsif ARGV[0] == 'init'
  begin
    raise ArgumentError if ARGV[1].nil?
    Docugit.setup(ARGV[1])
    puts "Initializing Docugit at #{ARGV[1]}"
  rescue ArgumentError => e
    puts "A Git repository directory is required to initialize Docugit. (ex. docugit init ~/Development/ProjectWiki/)"
  end
end