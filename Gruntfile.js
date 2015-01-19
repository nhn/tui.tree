//Grunt is just JavaScript running in node, after all...
module.exports = function(grunt) {

    // All upfront config goes in a massive nested object.
    grunt.initConfig({
        // You can set arbitrary key-value pairs.
        distFolder: 'dist',
        name: 'Tree',
        // You can also set the value of a key as parsed JSON.
        // Allows us to reference properties we declared in package.json.
        pkg: grunt.file.readJSON('package.json'),
        // Grunt tasks are associated with specific properties.
        // these names generally match their npm package name.
        concat: {
            // Specify some options, usually specific to each plugin.
            options: {
                banner: '(function() {\n',
                footer: '\n})();'
            },
            // 'dist' is what is called a "target."
            // It's a way of specifying different sub-tasks or modes.
            normal: {
                // The files to concatenate:
                // Notice the wildcard, which is automatically expanded.
                src: [
                    'src/common/*.js',
                    'src/js/tree.js',
                    'src/js/*.js'
                ],
                // The destination file:
                // Notice the angle-bracketed ERB-like templating,
                // which allows you to reference other properties.
                // This is equivalent to 'dist/main.js'.
                dest: '<%= distFolder %>/Component-<%= name %>.js'
                // You can reference any grunt config property you want.
                // Ex: '<%= concat.options.separator %>' instead of ';'
            },
            core: {
                // The files to concatenate:
                // Notice the wildcard, which is automatically expanded.
                src: [
                    'src/js/tree.js',
                    'src/js/*.js'
                ],
                // The destination file:
                // Notice the angle-bracketed ERB-like templating,
                // which allows you to reference other properties.
                // This is equivalent to 'dist/main.js'.
                dest: '<%= distFolder %>/Component-<%= name %>.core.js'
                // You can reference any grunt config property you want.
                // Ex: '<%= concat.options.separator %>' instead of ';'
            }
        },
        uglify: {
            normal: {
                files: {
                    '<%= distFolder %>/Component-<%= name %>.min.js' : '<%= distFolder %>/Component-<%= name %>.js'
                }
            },
            core: {
                files: {
                    '<%= distFolder %>/Component-<%= name %>.core.min.js' : '<%= distFolder %>/Component-<%= name %>.core.js'
                }
            }
        },
        copy: {
            main: {
                files: [
                    {expand: true, flatten: true, src: ['src/css/*'], dest: '<%= distFolder %>/', filter: 'isFile'}
                ]
            }
        },
        zip: {
            main: {
                src: ['<%= distFolder %>/*'],
                dest: '<%= distFolder %>/Component-<%= name %>.zip'
            }
        }
    }); // The end of grunt.initConfig

    // We've set up each task's configuration.
    // Now actually load the tasks.
    // This will do a lookup similar to node's require() function.
    grunt.loadNpmTasks('grunt-contrib-concat');
    grunt.loadNpmTasks('grunt-contrib-uglify');
    grunt.loadNpmTasks('grunt-contrib-copy');
    //grunt.loadNpmTasks('grunt-zip');

    // Register our own custom task alias.
    grunt.registerTask('build', ['concat', 'uglify', 'copy']);
};