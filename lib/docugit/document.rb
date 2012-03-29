class Document
  attr_reader :file, :file_name, :file_ext, :markdown_file_name
  COMPATIBLE_FILES = [:js, :css, :html]
  
  def initialize(file)
    @file = file  
    @file_name = file.split('/').last
    @file_ext = @file_name.split('.').last
    @markdown_file_name = @file_name + ".md"
  end
  
  def compatible?
    COMPATIBLE_FILES.include? @file_ext.to_sym
  end
  
  def search_pattern
    case @file_ext.to_sym
    when :js
      /(?<=\/\*\+)(.*?)(?=\+\*\/)/m
    when :css
      /(?<=\/\*\+)(.*?)(?=\+\*\/)/m
    when :html
      /(?<=\<\!--\+)(.*?)(?=\+--\>)/m
    end
  end

end