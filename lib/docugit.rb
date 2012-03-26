#! /usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'grit'

class Docugit
  attr_accessor :git_directory, :repo
  
  def initialize
    @git_directory = Dir.pwd
    @repo = Grit::Repo.new(@git_directory)
  end
  
  def committed_files
    commit = @repo.commits.first
    filenames = []
    commit.diffs.each do |diff|
      filenames << [diff.a_path, diff.b_path]
    end
    filenames
  end
  
end

d = Docugit.new
puts d.committed_files