#! /usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'grit'

class Docugit
  attr_accessor :git_directory, :repo
  
  def initialize
    @git_directory = Dir.pwd
    @repo = Grit::Repo.new(@git_directory)
  end
  
  def get_committed_files
    master_commits = @repo.commits
  end
  
end