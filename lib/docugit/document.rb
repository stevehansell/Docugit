class Document
  attr_reader :file, :file_name, :file_ext, :markdown_file_name
  
  def initialize(file)
    @file = file  
    @file_name = file.split('/').last
    @file_ext = @file_name.split('.').last
    @markdown_file_name = @file_name + ".md"
  end

end