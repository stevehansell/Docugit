#! /usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'grit'
require 'docugit/documenter'
require 'docugit/document'

class Docugit
  attr_reader :project_directory, :wiki_directory, :repo, :files, :documenter
  
  def self.setup(wiki_directory)
    File.open("#{Dir.pwd}/.docugit-config", "w+") {|f| f.write(wiki_directory) }
  end
  
  def initialize(args)
    @project_directory = Dir.pwd
    @wiki_directory = get_wiki_directory
    @repo = Grit::Repo.new(@project_directory)
    @files = committed_files
  end
  
  def committed_files
    commit = @repo.head.commit
    filenames = []
    commit.diffs.each do |diff|
      filenames << diff.a_path
    end
    filenames
  end
  
  def start
    puts "Documenting..."
    @documenter = Documenter.new(@files, @wiki_directory)
    @documenter.document  
    puts "\n"
    puts "Added documentation to #{@wiki_directory} and commited #{@documenter.count_markdown_files} file(s)."
  end
  
  def commit_to_wiki
    Dir.chdir(@wiki_directory) do
      wiki_repo = Grit::Repo.new(@wiki_directory)
      wiki_repo.add(@documenter.markdown_file_names)
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
  docugit.start
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