require 'json'

Pod::Spec.new do |s|
  package = JSON.parse(File.read(File.join(__dir__, 'package.json')))

  s.name          = "RNFastImage"
  s.version       = package['version']
  s.summary       = package['description']
  s.authors       = { "Dream Horizon" => "info@dreamhorizon.org" }
  s.homepage      = "https://github.com/dream-horizon-org/react-native-fast-image#readme"
  s.license       = "MIT"
  s.framework = 'UIKit'
  s.requires_arc  = true
  s.source        = { :git => "https://github.com/dream-horizon-org/react-native-fast-image.git", :tag => "v#{s.version}" }
  s.platforms     = { :ios => "8.0", :tvos => "9.0" }
  s.source_files  = "ios/**/*.{h,m,mm}"
  s.dependency 'React-Core'
  s.dependency 'SDWebImage', '>= 5.19.1', '< 6.0'
  s.dependency 'SDWebImageWebPCoder', '~> 0.14.6'
end
